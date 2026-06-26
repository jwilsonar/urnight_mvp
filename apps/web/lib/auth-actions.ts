'use server';

import { AuthError } from 'next-auth';
import { loginSchema, registerSchema, type LoginDto, type RegisterDto } from '@urnight/contracts';
import { ApiError } from './api/client';
import { loginRequest, registerRequest } from './api/auth/requests';
import { getErrorMessage } from './api/error-messages';
import { signIn, signOut } from './auth';
import { createLogger } from './logger';

const log = createLogger('auth-actions');

export interface AuthActionResult {
  ok: boolean;
  /** Mensaje general localizado (para Alert). */
  error?: string;
  /** Código de dominio del backend (p. ej. identity/email_taken). */
  code?: string;
  /** Errores por campo para feedback inline en el formulario. */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Establece la sesión a partir de tokens ya obtenidos del backend. Los tokens
 * viajan server→server hacia `Credentials` (handoff); nunca llegan al cliente.
 */
async function establishSession(tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<AuthActionResult> {
  try {
    await signIn('credentials', {
      redirect: false,
      handoff: JSON.stringify(tokens),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      log.warn({ type: err.type }, 'web.auth.session_failed');
      return { ok: false, error: 'No pudimos iniciar tu sesión. Inténtalo de nuevo.' };
    }
    throw err;
  }
}

export async function loginAction(values: LoginDto): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: 'Revisa los datos ingresados.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const tokens = await loginRequest(parsed.data);
    log.info({}, 'web.auth.login.success');
    return establishSession(tokens);
  } catch (err) {
    return toActionError(err, 'login');
  }
}

export async function registerAction(values: RegisterDto): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: 'Revisa los datos ingresados.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const tokens = await registerRequest(parsed.data);
    log.info({}, 'web.auth.register.success');
    return establishSession(tokens);
  } catch (err) {
    return toActionError(err, 'register');
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

function toActionError(err: unknown, flow: 'login' | 'register'): AuthActionResult {
  if (err instanceof ApiError) {
    log.warn({ flow, status: err.status, code: err.code }, 'web.auth.failed');
    return { ok: false, error: getErrorMessage(err), code: err.code, fieldErrors: err.fieldErrors };
  }
  log.error({ flow, err: (err as Error).message }, 'web.auth.unexpected_error');
  return { ok: false, error: getErrorMessage(err) };
}
