import { Inject, Injectable } from '@nestjs/common';
import {
  mfaUnlockOperator,
  userMfaFactor,
  userRecoveryCode,
} from '@urnight/db';
import { and, count, desc, eq, isNull, ne } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { REDIS } from '../../../../shared/redis/redis.module';
import type {
  MfaChallenge,
  MfaFactor,
  MfaRecoveryCode,
  MfaRepository,
} from '../../domain/ports/mfa.repository';
import { AesGcmSecretCipher } from '../auth/aes-gcm-secret-cipher';

type MfaFactorRow = typeof userMfaFactor.$inferSelect;
type RecoveryCodeRow = typeof userRecoveryCode.$inferSelect;

const CHALLENGE_NS = 'identity:mfa:challenge';
const challengeKey = (id: string): string => `${CHALLENGE_NS}:${id}`;
const CONSUME_CHALLENGE_SCRIPT = `
local userId = redis.call('GET', KEYS[1])
if userId == ARGV[1] then
  redis.call('DEL', KEYS[1])
  return 1
end
return 0
`;

/** Persistencia MFA: Drizzle para factores/códigos/operadores y Redis para desafíos. */
@Injectable()
export class DrizzleMfaRepository implements MfaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly cipher: AesGcmSecretCipher,
  ) {}

  async hasActiveFactor(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: userMfaFactor.id })
      .from(userMfaFactor)
      .where(and(eq(userMfaFactor.userId, userId), eq(userMfaFactor.status, 'active')))
      .limit(1);
    return Boolean(row);
  }

  async findCurrentFactor(userId: string): Promise<MfaFactor | null> {
    const [row] = await this.db
      .select()
      .from(userMfaFactor)
      .where(and(eq(userMfaFactor.userId, userId), ne(userMfaFactor.status, 'revoked')))
      .orderBy(desc(userMfaFactor.createdAt))
      .limit(1);
    return row ? this.toFactor(row) : null;
  }

  async findActiveFactor(userId: string): Promise<MfaFactor | null> {
    const [row] = await this.db
      .select()
      .from(userMfaFactor)
      .where(and(eq(userMfaFactor.userId, userId), eq(userMfaFactor.status, 'active')))
      .limit(1);
    return row ? this.toFactor(row) : null;
  }

  async replacePendingFactor(input: {
    id: string;
    userId: string;
    secret: string;
    createdAt: Date;
  }): Promise<MfaFactor> {
    return this.db.transaction(async (tx) => {
      await tx
        .update(userMfaFactor)
        .set({ status: 'revoked', updatedAt: input.createdAt })
        .where(
          and(
            eq(userMfaFactor.userId, input.userId),
            eq(userMfaFactor.status, 'pending'),
          ),
        );
      const [row] = await tx
        .insert(userMfaFactor)
        .values({
          id: input.id,
          userId: input.userId,
          type: 'totp',
          secretEncrypted: this.cipher.encrypt(input.secret),
          status: 'pending',
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        })
        .returning();
      if (!row) throw new Error('No se pudo crear el factor MFA');
      return this.toFactor(row);
    });
  }

  async confirmEnrollment(input: {
    factorId: string;
    userId: string;
    codeHashes: string[];
    confirmedAt: Date;
  }): Promise<MfaFactor> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(userMfaFactor)
        .set({
          status: 'active',
          confirmedAt: input.confirmedAt,
          updatedAt: input.confirmedAt,
        })
        .where(
          and(
            eq(userMfaFactor.id, input.factorId),
            eq(userMfaFactor.userId, input.userId),
            eq(userMfaFactor.status, 'pending'),
          ),
        )
        .returning();
      if (!row) throw new Error('No se pudo confirmar el factor MFA');
      await tx.insert(userRecoveryCode).values(
        input.codeHashes.map((codeHash) => ({
          userId: input.userId,
          codeHash,
          createdAt: input.confirmedAt,
        })),
      );
      return this.toFactor(row);
    });
  }

  async markFactorUsed(factorId: string, usedAt: Date): Promise<void> {
    await this.db
      .update(userMfaFactor)
      .set({ lastUsedAt: usedAt, updatedAt: usedAt })
      .where(and(eq(userMfaFactor.id, factorId), eq(userMfaFactor.status, 'active')));
  }

  async revokeForUser(userId: string, revokedAt: Date): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const revoked = await tx
        .update(userMfaFactor)
        .set({ status: 'revoked', updatedAt: revokedAt })
        .where(and(eq(userMfaFactor.userId, userId), ne(userMfaFactor.status, 'revoked')))
        .returning({ id: userMfaFactor.id });
      await tx
        .update(userRecoveryCode)
        .set({ usedAt: revokedAt })
        .where(and(eq(userRecoveryCode.userId, userId), isNull(userRecoveryCode.usedAt)));
      return revoked.length > 0;
    });
  }

  async listUnusedRecoveryCodes(userId: string): Promise<MfaRecoveryCode[]> {
    const rows = await this.db
      .select()
      .from(userRecoveryCode)
      .where(and(eq(userRecoveryCode.userId, userId), isNull(userRecoveryCode.usedAt)));
    return rows.map((row) => this.toRecoveryCode(row));
  }

  async consumeRecoveryCode(id: string, usedAt: Date): Promise<boolean> {
    const rows = await this.db
      .update(userRecoveryCode)
      .set({ usedAt })
      .where(and(eq(userRecoveryCode.id, id), isNull(userRecoveryCode.usedAt)))
      .returning({ id: userRecoveryCode.id });
    return rows.length === 1;
  }

  async replaceRecoveryCodes(
    userId: string,
    codeHashes: string[],
    createdAt: Date,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(userRecoveryCode)
        .set({ usedAt: createdAt })
        .where(and(eq(userRecoveryCode.userId, userId), isNull(userRecoveryCode.usedAt)));
      await tx.insert(userRecoveryCode).values(
        codeHashes.map((codeHash) => ({ userId, codeHash, createdAt })),
      );
    });
  }

  async countUnusedRecoveryCodes(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(userRecoveryCode)
      .where(and(eq(userRecoveryCode.userId, userId), isNull(userRecoveryCode.usedAt)));
    return row?.value ?? 0;
  }

  async isUnlockOperator(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: mfaUnlockOperator.userId })
      .from(mfaUnlockOperator)
      .where(eq(mfaUnlockOperator.userId, userId))
      .limit(1);
    return Boolean(row);
  }

  async storeChallenge(challenge: MfaChallenge): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.ceil((challenge.expiresAt.getTime() - Date.now()) / 1000),
    );
    await this.redis.set(challengeKey(challenge.id), challenge.userId, 'EX', ttlSeconds);
  }

  async findChallenge(id: string): Promise<MfaChallenge | null> {
    const userId = await this.redis.get(challengeKey(id));
    return userId
      ? { id, userId, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
      : null;
  }

  async consumeChallenge(id: string, userId: string): Promise<boolean> {
    const consumed = await this.redis.eval(
      CONSUME_CHALLENGE_SCRIPT,
      1,
      challengeKey(id),
      userId,
    );
    return Number(consumed) === 1;
  }

  private toFactor(row: MfaFactorRow): MfaFactor {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type as MfaFactor['type'],
      secret: this.cipher.decrypt(row.secretEncrypted),
      status: row.status as MfaFactor['status'],
      confirmedAt: row.confirmedAt,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toRecoveryCode(row: RecoveryCodeRow): MfaRecoveryCode {
    return {
      id: row.id,
      userId: row.userId,
      codeHash: row.codeHash,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
