export type MfaFactorType = 'totp';
export type MfaFactorStatus = 'pending' | 'active' | 'revoked';

export interface MfaFactor {
  id: string;
  userId: string;
  type: MfaFactorType;
  /** Secreto descifrado solo dentro del proceso del API; nunca cruza HTTP salvo al crearlo. */
  secret: string;
  status: MfaFactorStatus;
  confirmedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MfaRecoveryCode {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: Date | null;
  createdAt: Date;
}

export interface MfaChallenge {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface MfaRepository {
  hasActiveFactor(userId: string): Promise<boolean>;
  findCurrentFactor(userId: string): Promise<MfaFactor | null>;
  findActiveFactor(userId: string): Promise<MfaFactor | null>;
  replacePendingFactor(input: {
    id: string;
    userId: string;
    secret: string;
    createdAt: Date;
  }): Promise<MfaFactor>;
  confirmEnrollment(input: {
    factorId: string;
    userId: string;
    codeHashes: string[];
    confirmedAt: Date;
  }): Promise<MfaFactor>;
  markFactorUsed(factorId: string, usedAt: Date): Promise<void>;
  revokeForUser(userId: string, revokedAt: Date): Promise<boolean>;
  listUnusedRecoveryCodes(userId: string): Promise<MfaRecoveryCode[]>;
  consumeRecoveryCode(id: string, usedAt: Date): Promise<boolean>;
  replaceRecoveryCodes(userId: string, codeHashes: string[], createdAt: Date): Promise<void>;
  countUnusedRecoveryCodes(userId: string): Promise<number>;
  isUnlockOperator(userId: string): Promise<boolean>;
  storeChallenge(challenge: MfaChallenge): Promise<void>;
  findChallenge(id: string): Promise<MfaChallenge | null>;
  consumeChallenge(id: string, userId: string): Promise<boolean>;
}

export const MFA_REPOSITORY = Symbol('MFA_REPOSITORY');
