import type { LocalDocumentType } from '@urnight/contracts';

export interface VerificationPolicy {
  requiredDocumentTypes: LocalDocumentType[];
  expiryWarningDays: number;
}

export interface VerificationPolicyPort {
  getPolicy(): Promise<VerificationPolicy>;
}

export const VERIFICATION_POLICY_PORT = Symbol('VERIFICATION_POLICY_PORT');
