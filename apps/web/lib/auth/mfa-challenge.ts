import "server-only";

import { cookies } from "next/headers";

const MFA_CHALLENGE_COOKIE = "ravenue.mfa_challenge";
const FALLBACK_TTL_MS = 5 * 60 * 1000;

export interface PendingMfaChallenge {
  challengeId: string;
  expiresAt: string;
}

export async function storePendingMfaChallenge(
  challenge: PendingMfaChallenge,
): Promise<void> {
  const parsedExpiry = Date.parse(challenge.expiresAt);
  const expiresAt = Number.isFinite(parsedExpiry)
    ? parsedExpiry
    : Date.now() + FALLBACK_TTL_MS;
  const value = Buffer.from(
    JSON.stringify({
      challengeId: challenge.challengeId,
      expiresAt: new Date(expiresAt).toISOString(),
    }),
    "utf8",
  ).toString("base64url");
  const store = await cookies();
  store.set(MFA_CHALLENGE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function readPendingMfaChallenge(): Promise<PendingMfaChallenge | null> {
  const store = await cookies();
  const value = store.get(MFA_CHALLENGE_COOKIE)?.value;
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<PendingMfaChallenge>;
    if (
      typeof parsed.challengeId !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.expiresAt))
    ) {
      return null;
    }
    return {
      challengeId: parsed.challengeId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function clearPendingMfaChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(MFA_CHALLENGE_COOKIE);
}
