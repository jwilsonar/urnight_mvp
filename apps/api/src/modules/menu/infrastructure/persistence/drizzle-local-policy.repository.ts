import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { localOrderWindow, localPolicy } from '@urnight/db';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { LocalOrderWindow } from '../../domain/entities/local-order-window.entity';
import { LocalPolicy } from '../../domain/entities/local-policy.entity';
import type { LocalPolicyRepository } from '../../domain/ports/local-policy.repository';

type PolicyRow = typeof localPolicy.$inferSelect;

@Injectable()
export class DrizzleLocalPolicyRepository implements LocalPolicyRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findPolicy(localId: string): Promise<LocalPolicy | null> {
    const [row] = await this.db
      .select()
      .from(localPolicy)
      .where(eq(localPolicy.localId, localId))
      .limit(1);
    return row ? this.policyToDomain(row) : null;
  }

  async createPolicyIfMissing(policy: LocalPolicy): Promise<LocalPolicy> {
    const [created] = await this.db
      .insert(localPolicy)
      .values(this.policyValues(policy))
      .onConflictDoNothing({ target: localPolicy.localId })
      .returning();
    if (created) return this.policyToDomain(created);
    const existing = await this.findPolicy(policy.localId);
    if (!existing) throw new Error('No se pudo crear la política del local.');
    return existing;
  }

  async upsertPolicy(policy: LocalPolicy): Promise<LocalPolicy> {
    const [row] = await this.db
      .insert(localPolicy)
      .values(this.policyValues(policy))
      .onConflictDoUpdate({
        target: localPolicy.localId,
        set: {
          reservationDepositPercent: policy.reservationDepositPercent,
          birthdayWindowDays: policy.birthdayWindowDays,
          updatedAt: policy.updatedAt,
        },
      })
      .returning();
    if (!row) throw new Error('No se pudo guardar la política del local.');
    return this.policyToDomain(row);
  }

  async listOrderWindows(localId: string): Promise<LocalOrderWindow[]> {
    const rows = await this.db
      .select()
      .from(localOrderWindow)
      .where(eq(localOrderWindow.localId, localId))
      .orderBy(asc(localOrderWindow.dayOfWeek), asc(localOrderWindow.startsAt));
    return rows.map((row) =>
      LocalOrderWindow.fromPersistence({
        id: row.id,
        localId: row.localId,
        dayOfWeek: row.dayOfWeek,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      }),
    );
  }

  async replaceOrderWindows(
    localId: string,
    windows: LocalOrderWindow[],
    tx?: unknown,
  ): Promise<LocalOrderWindow[]> {
    const exec = this.exec(tx);
    await exec.delete(localOrderWindow).where(eq(localOrderWindow.localId, localId));
    if (windows.length === 0) return [];
    const rows = await exec
      .insert(localOrderWindow)
      .values(
        windows.map((window) => ({
          id: window.id,
          localId,
          dayOfWeek: window.dayOfWeek,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        })),
      )
      .returning();
    return rows
      .map((row) =>
        LocalOrderWindow.fromPersistence({
          id: row.id,
          localId: row.localId,
          dayOfWeek: row.dayOfWeek,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
        }),
      )
      .sort(
        (left, right) =>
          left.dayOfWeek - right.dayOfWeek || left.startsAt.localeCompare(right.startsAt),
      );
  }

  private policyValues(policy: LocalPolicy) {
    return {
      id: policy.id,
      localId: policy.localId,
      reservationDepositPercent: policy.reservationDepositPercent,
      birthdayWindowDays: policy.birthdayWindowDays,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }

  private policyToDomain(row: PolicyRow): LocalPolicy {
    return LocalPolicy.fromPersistence({
      id: row.id,
      localId: row.localId,
      reservationDepositPercent: row.reservationDepositPercent,
      birthdayWindowDays: row.birthdayWindowDays,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
