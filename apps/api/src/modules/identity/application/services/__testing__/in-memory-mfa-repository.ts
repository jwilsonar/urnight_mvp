import { randomUUID } from 'node:crypto';
import type {
  MfaChallenge,
  MfaFactor,
  MfaRecoveryCode,
  MfaRepository,
} from '../../../domain/ports/mfa.repository';

export class InMemoryMfaRepository implements MfaRepository {
  readonly factors: MfaFactor[] = [];
  readonly recoveryCodes: MfaRecoveryCode[] = [];
  readonly challenges = new Map<string, MfaChallenge>();
  readonly unlockOperators = new Set<string>();

  seedActiveFactor(userId: string, secret = 'TESTSECRET'): MfaFactor {
    const now = new Date();
    const factor: MfaFactor = {
      id: randomUUID(),
      userId,
      type: 'totp',
      secret,
      status: 'active',
      confirmedAt: now,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.factors.push(factor);
    return factor;
  }

  seedUnlockOperator(userId: string): void {
    this.unlockOperators.add(userId);
  }

  async hasActiveFactor(userId: string): Promise<boolean> {
    return this.factors.some((factor) => factor.userId === userId && factor.status === 'active');
  }

  async findCurrentFactor(userId: string): Promise<MfaFactor | null> {
    return (
      this.factors.find(
        (factor) => factor.userId === userId && factor.status !== 'revoked',
      ) ?? null
    );
  }

  async findActiveFactor(userId: string): Promise<MfaFactor | null> {
    return (
      this.factors.find(
        (factor) => factor.userId === userId && factor.status === 'active',
      ) ?? null
    );
  }

  async replacePendingFactor(input: {
    id: string;
    userId: string;
    secret: string;
    createdAt: Date;
  }): Promise<MfaFactor> {
    for (const factor of this.factors) {
      if (factor.userId === input.userId && factor.status === 'pending') {
        factor.status = 'revoked';
        factor.updatedAt = input.createdAt;
      }
    }
    const factor: MfaFactor = {
      id: input.id,
      userId: input.userId,
      type: 'totp',
      secret: input.secret,
      status: 'pending',
      confirmedAt: null,
      lastUsedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.factors.push(factor);
    return factor;
  }

  async confirmEnrollment(input: {
    factorId: string;
    userId: string;
    codeHashes: string[];
    confirmedAt: Date;
  }): Promise<MfaFactor> {
    const factor = this.factors.find(
      (candidate) =>
        candidate.id === input.factorId &&
        candidate.userId === input.userId &&
        candidate.status === 'pending',
    );
    if (!factor) throw new Error('Factor pendiente no encontrado');
    factor.status = 'active';
    factor.confirmedAt = input.confirmedAt;
    factor.updatedAt = input.confirmedAt;
    await this.replaceRecoveryCodes(input.userId, input.codeHashes, input.confirmedAt);
    return factor;
  }

  async markFactorUsed(factorId: string, usedAt: Date): Promise<void> {
    const factor = this.factors.find((candidate) => candidate.id === factorId);
    if (factor) {
      factor.lastUsedAt = usedAt;
      factor.updatedAt = usedAt;
    }
  }

  async revokeForUser(userId: string, revokedAt: Date): Promise<boolean> {
    const current = this.factors.filter(
      (factor) => factor.userId === userId && factor.status !== 'revoked',
    );
    for (const factor of current) {
      factor.status = 'revoked';
      factor.updatedAt = revokedAt;
    }
    for (const code of this.recoveryCodes) {
      if (code.userId === userId && code.usedAt === null) code.usedAt = revokedAt;
    }
    return current.length > 0;
  }

  async listUnusedRecoveryCodes(userId: string): Promise<MfaRecoveryCode[]> {
    return this.recoveryCodes.filter((code) => code.userId === userId && code.usedAt === null);
  }

  async consumeRecoveryCode(id: string, usedAt: Date): Promise<boolean> {
    const code = this.recoveryCodes.find((candidate) => candidate.id === id);
    if (!code || code.usedAt !== null) return false;
    code.usedAt = usedAt;
    return true;
  }

  async replaceRecoveryCodes(
    userId: string,
    codeHashes: string[],
    createdAt: Date,
  ): Promise<void> {
    for (const code of this.recoveryCodes) {
      if (code.userId === userId && code.usedAt === null) code.usedAt = createdAt;
    }
    this.recoveryCodes.push(
      ...codeHashes.map((codeHash) => ({
        id: randomUUID(),
        userId,
        codeHash,
        usedAt: null,
        createdAt,
      })),
    );
  }

  async countUnusedRecoveryCodes(userId: string): Promise<number> {
    return (await this.listUnusedRecoveryCodes(userId)).length;
  }

  async isUnlockOperator(userId: string): Promise<boolean> {
    return this.unlockOperators.has(userId);
  }

  async storeChallenge(challenge: MfaChallenge): Promise<void> {
    this.challenges.set(challenge.id, challenge);
  }

  async findChallenge(id: string): Promise<MfaChallenge | null> {
    const challenge = this.challenges.get(id);
    if (!challenge) return null;
    if (challenge.expiresAt.getTime() <= Date.now()) {
      this.challenges.delete(id);
      return null;
    }
    return challenge;
  }

  async consumeChallenge(id: string, userId: string): Promise<boolean> {
    const challenge = await this.findChallenge(id);
    if (!challenge || challenge.userId !== userId) return false;
    this.challenges.delete(id);
    return true;
  }
}
