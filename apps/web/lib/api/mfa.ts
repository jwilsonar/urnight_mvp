import type {
  AuthTokensResponse,
  ConfirmMfaEnrollmentDto,
  MfaReauthenticationDto,
  MfaStatusResponse,
  RecoveryCodesResponse,
  StartMfaEnrollmentResponse,
  UseRecoveryCodeDto,
  VerifyMfaChallengeDto,
} from "@urnight/contracts";
import { apiFetch } from "./client";

export function verifyMfaChallenge(
  dto: VerifyMfaChallengeDto,
): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/mfa/verify", {
    method: "POST",
    json: dto,
  });
}

export function useMfaRecoveryCode(
  dto: UseRecoveryCodeDto,
): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/mfa/recovery", {
    method: "POST",
    json: dto,
  });
}

export function getMfaStatus(token: string): Promise<MfaStatusResponse> {
  return apiFetch<MfaStatusResponse>("/mfa/status", { token });
}

export function startMfaEnrollment(
  token: string,
): Promise<StartMfaEnrollmentResponse> {
  return apiFetch<StartMfaEnrollmentResponse>("/mfa/enroll", {
    method: "POST",
    token,
  });
}

export function confirmMfaEnrollment(
  dto: ConfirmMfaEnrollmentDto,
  token: string,
): Promise<RecoveryCodesResponse> {
  return apiFetch<RecoveryCodesResponse>("/mfa/enroll/confirm", {
    method: "POST",
    json: dto,
    token,
  });
}

export function revokeMfa(
  dto: MfaReauthenticationDto,
  token: string,
): Promise<void> {
  return apiFetch<void>("/mfa/revoke", {
    method: "POST",
    json: dto,
    token,
  });
}

export function regenerateMfaRecoveryCodes(
  dto: MfaReauthenticationDto,
  token: string,
): Promise<RecoveryCodesResponse> {
  return apiFetch<RecoveryCodesResponse>("/mfa/recovery-codes", {
    method: "POST",
    json: dto,
    token,
  });
}
