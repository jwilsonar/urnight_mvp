"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import {
  loginSchema,
  registerSchema,
  sendMfaEmailCodeSchema,
  useRecoveryCodeSchema,
  verifyMfaEmailCodeSchema,
  verifyMfaChallengeSchema,
  type LoginDto,
  type RegisterDto,
} from "@urnight/contracts";
import { ApiError } from "./api/client";
import { loginRequest, registerRequest } from "./api/auth/requests";
import {
  sendMfaEmailCode,
  useMfaRecoveryCode,
  verifyMfaChallenge,
  verifyMfaEmailCode,
} from "./api/mfa";
import {
  getErrorMessage,
  type ErrorMessageTranslator,
} from "./api/error-messages";
import { signIn, signOut } from "./auth";
import {
  clearPendingMfaChallenge,
  readPendingMfaChallenge,
  storePendingMfaChallenge,
} from "./auth/mfa-challenge";
import { toBaseLocale } from "./i18n/config";
import { createLogger } from "./logger";
import { zodErrorMapEn } from "./validation/zod-en";
import { zodErrorMapEs } from "./validation/zod-es";

const log = createLogger("auth-actions");

export interface AuthActionResult {
  ok: boolean;
  /** Mensaje general localizado (para Alert). */
  error?: string;
  /** Código de dominio del backend (p. ej. identity/email-already-registered). */
  code?: string;
  /** Errores por campo para feedback inline en el formulario. */
  fieldErrors?: Record<string, string[]>;
  /**
   * Presente cuando la cuenta tiene MFA activo: el API no emitió tokens y hay
   * que completar el desafío antes de tener sesión.
   */
  mfaChallengeId?: string;
}

export interface MfaEmailActionResult extends AuthActionResult {
  sentTo?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
}

/**
 * Establece la sesión a partir de tokens ya obtenidos del backend. Los tokens
 * viajan server→server hacia `Credentials` (handoff); nunca llegan al cliente.
 */
async function establishSession(
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  translate: ErrorMessageTranslator,
): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      redirect: false,
      handoff: JSON.stringify(tokens),
    });
    await clearPendingMfaChallenge();
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      log.warn({ type: err.type }, "web.auth.session_failed");
      return { ok: false, error: translate("sessionFailed") };
    }
    throw err;
  }
}

export async function loginAction(values: LoginDto): Promise<AuthActionResult> {
  const { errorMap, translate } = await authI18n();
  const parsed = loginSchema.safeParse(values, { errorMap });
  if (!parsed.success) {
    return {
      ok: false,
      error: translate("invalidData"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const outcome = await loginRequest(parsed.data);
    // Con MFA activo el API no emite tokens: entrega un desafío que hay que
    // resolver antes de tener sesión (§5 de docs/spec-mfa-identity.md).
    if (outcome.kind === "mfa_challenge") {
      await storePendingMfaChallenge({
        challengeId: outcome.challengeId,
        expiresAt: outcome.expiresAt,
      });
      log.info({}, "web.auth.login.mfa_challenge");
      return {
        ok: false,
        code: "identity/mfa-required",
        error: translate("mfaChallengePending"),
        mfaChallengeId: outcome.challengeId,
      };
    }
    log.info({}, "web.auth.login.success");
    return establishSession(outcome.result, translate);
  } catch (err) {
    return toActionError(err, "login", translate);
  }
}

export async function registerAction(
  values: RegisterDto,
): Promise<AuthActionResult> {
  const { errorMap, translate } = await authI18n();
  const parsed = registerSchema.safeParse(values, { errorMap });
  if (!parsed.success) {
    return {
      ok: false,
      error: translate("invalidData"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const tokens = await registerRequest(parsed.data);
    log.info({}, "web.auth.register.success");
    return establishSession(tokens, translate);
  } catch (err) {
    return toActionError(err, "register", translate);
  }
}

export async function signOutAction(): Promise<void> {
  revalidatePath("/", "layout");
  await signOut({ redirectTo: "/login" });
}

export async function verifyMfaAction(code: string): Promise<AuthActionResult> {
  const challenge = await readPendingMfaChallenge();
  const { translate } = await authI18n();
  if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
    await clearPendingMfaChallenge();
    return {
      ok: false,
      code: "identity/mfa-challenge-expired",
      error: translate("mfaChallengeExpired"),
    };
  }

  const parsed = verifyMfaChallengeSchema.safeParse({
    challengeId: challenge.challengeId,
    code,
  });
  if (!parsed.success) {
    return { ok: false, error: translate("invalidData") };
  }

  try {
    const result = await establishSession(
      await verifyMfaChallenge(parsed.data),
      translate,
    );
    return result;
  } catch (err) {
    return handleMfaChallengeError(err, translate);
  }
}

export async function useMfaRecoveryAction(
  recoveryCode: string,
): Promise<AuthActionResult> {
  const challenge = await readPendingMfaChallenge();
  const { translate } = await authI18n();
  if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
    await clearPendingMfaChallenge();
    return {
      ok: false,
      code: "identity/mfa-challenge-expired",
      error: translate("mfaChallengeExpired"),
    };
  }

  const parsed = useRecoveryCodeSchema.safeParse({
    challengeId: challenge.challengeId,
    recoveryCode,
  });
  if (!parsed.success) {
    return { ok: false, error: translate("invalidData") };
  }

  try {
    const result = await establishSession(
      await useMfaRecoveryCode(parsed.data),
      translate,
    );
    return result;
  } catch (err) {
    return handleMfaChallengeError(err, translate);
  }
}

export async function sendMfaEmailAction(): Promise<MfaEmailActionResult> {
  const challenge = await readPendingMfaChallenge();
  const { translate } = await authI18n();
  if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
    await clearPendingMfaChallenge();
    return {
      ok: false,
      code: "identity/mfa-challenge-expired",
      error: translate("mfaChallengeExpired"),
    };
  }

  const parsed = sendMfaEmailCodeSchema.safeParse({
    challengeId: challenge.challengeId,
  });
  if (!parsed.success) {
    return { ok: false, error: translate("invalidData") };
  }

  try {
    return { ok: true, ...(await sendMfaEmailCode(parsed.data)) };
  } catch (err) {
    return handleMfaChallengeError(err, translate);
  }
}

export async function verifyMfaEmailAction(
  code: string,
): Promise<AuthActionResult> {
  const challenge = await readPendingMfaChallenge();
  const { translate } = await authI18n();
  if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
    await clearPendingMfaChallenge();
    return {
      ok: false,
      code: "identity/mfa-challenge-expired",
      error: translate("mfaChallengeExpired"),
    };
  }

  const parsed = verifyMfaEmailCodeSchema.safeParse({
    challengeId: challenge.challengeId,
    code,
  });
  if (!parsed.success) {
    return { ok: false, error: translate("invalidData") };
  }

  try {
    return await establishSession(
      await verifyMfaEmailCode(parsed.data),
      translate,
    );
  } catch (err) {
    return handleMfaChallengeError(err, translate);
  }
}

function toActionError(
  err: unknown,
  flow: "login" | "register",
  translate: ErrorMessageTranslator,
): AuthActionResult {
  if (err instanceof ApiError) {
    log.warn({ flow, status: err.status, code: err.code }, "web.auth.failed");
    return {
      ok: false,
      error: getErrorMessage(err, translate),
      code: err.code,
      fieldErrors: err.fieldErrors,
    };
  }
  log.error({ flow, err: (err as Error).message }, "web.auth.unexpected_error");
  return { ok: false, error: getErrorMessage(err, translate) };
}

async function handleMfaChallengeError(
  err: unknown,
  translate: ErrorMessageTranslator,
): Promise<AuthActionResult> {
  const result = toActionError(err, "login", translate);
  if (
    result.code === "identity/mfa-challenge-expired" ||
    result.code === "identity/mfa-locked"
  ) {
    await clearPendingMfaChallenge();
  }
  return result;
}

async function authI18n() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("auth.errors"),
  ]);
  return {
    errorMap: toBaseLocale(locale) === "en" ? zodErrorMapEn : zodErrorMapEs,
    translate: ((key) => t(key)) satisfies ErrorMessageTranslator,
  };
}
