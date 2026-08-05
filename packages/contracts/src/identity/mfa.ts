import { z } from 'zod';
import { authTokensResponseSchema } from './auth';

export const mfaCodeSchema = z.string().trim().regex(/^\d{6}$/);
export const mfaChallengeIdSchema = z.string().uuid();

export const verifyMfaChallengeSchema = z.object({
  challengeId: mfaChallengeIdSchema,
  code: mfaCodeSchema,
});
export type VerifyMfaChallengeDto = z.infer<typeof verifyMfaChallengeSchema>;

export const useRecoveryCodeSchema = z.object({
  challengeId: mfaChallengeIdSchema,
  recoveryCode: z.string().trim().min(1).max(64),
});
export type UseRecoveryCodeDto = z.infer<typeof useRecoveryCodeSchema>;

export const confirmMfaEnrollmentSchema = z.object({ code: mfaCodeSchema });
export type ConfirmMfaEnrollmentDto = z.infer<typeof confirmMfaEnrollmentSchema>;

export const mfaReauthenticationSchema = z.object({
  password: z.string().min(1).max(72),
});
export type MfaReauthenticationDto = z.infer<typeof mfaReauthenticationSchema>;

export const unlockMfaSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});
export type UnlockMfaDto = z.infer<typeof unlockMfaSchema>;

export const mfaChallengeResponseSchema = z.object({
  kind: z.literal('mfa_challenge'),
  challengeId: mfaChallengeIdSchema,
  expiresAt: z.string().datetime(),
});

export const loginOutcomeResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('session'), result: authTokensResponseSchema }),
  mfaChallengeResponseSchema,
]);
export type LoginOutcomeResponse = z.infer<typeof loginOutcomeResponseSchema>;

export const startMfaEnrollmentResponseSchema = z.object({
  otpauthUri: z.string().startsWith('otpauth://'),
  secret: z.string().min(16).max(128),
});
export type StartMfaEnrollmentResponse = z.infer<typeof startMfaEnrollmentResponseSchema>;

export const recoveryCodesResponseSchema = z.object({
  recoveryCodes: z.array(z.string().min(1).max(64)).length(10),
});
export type RecoveryCodesResponse = z.infer<typeof recoveryCodesResponseSchema>;

export const mfaStatusResponseSchema = z.discriminatedUnion('enrolled', [
  z.object({
    enrolled: z.literal(false),
    type: z.null(),
    confirmedAt: z.null(),
    recoveryCodesLeft: z.literal(0),
  }),
  z.object({
    enrolled: z.literal(true),
    type: z.literal('totp'),
    confirmedAt: z.string().datetime(),
    recoveryCodesLeft: z.number().int().nonnegative(),
  }),
]);
export type MfaStatusResponse = z.infer<typeof mfaStatusResponseSchema>;
