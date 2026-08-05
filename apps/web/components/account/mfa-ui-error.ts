import { IDENTITY_ERROR_CODES } from "@urnight/contracts";
import { ApiError } from "@/lib/api/client";

export type MfaUiErrorKey =
  | "errors.invalidCode"
  | "errors.invalidPassword"
  | "errors.alreadyEnrolled"
  | "errors.notEnrolled"
  | "errors.generic";

export function getMfaUiErrorKey(error: unknown): MfaUiErrorKey {
  if (error instanceof ApiError) {
    if (error.code === IDENTITY_ERROR_CODES.INVALID_MFA_CODE) {
      return "errors.invalidCode";
    }
    if (error.code === IDENTITY_ERROR_CODES.INVALID_CREDENTIALS) {
      return "errors.invalidPassword";
    }
    if (error.code === IDENTITY_ERROR_CODES.MFA_ALREADY_ENROLLED) {
      return "errors.alreadyEnrolled";
    }
    if (error.code === IDENTITY_ERROR_CODES.MFA_NOT_ENROLLED) {
      return "errors.notEnrolled";
    }
  }
  return "errors.generic";
}
