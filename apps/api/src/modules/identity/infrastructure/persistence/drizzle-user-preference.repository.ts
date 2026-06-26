import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { userPreference } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import type { UserPreferenceRepository } from '../../domain/ports/user-preference.repository';

type PreferenceRow = typeof userPreference.$inferSelect;

/** Adapter Drizzle del puerto UserPreferenceRepository (1:1 con User). */
@Injectable()
export class DrizzleUserPreferenceRepository implements UserPreferenceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findByUser(userId: string): Promise<UserPreference | null> {
    const [row] = await this.db
      .select()
      .from(userPreference)
      .where(eq(userPreference.userId, userId))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(entity: UserPreference, tx?: unknown): Promise<UserPreference> {
    const [row] = await this.exec(tx)
      .insert(userPreference)
      .values({
        id: entity.id,
        userId: entity.userId,
        onboardingCompleted: entity.onboardingCompleted,
        acceptsMarketing: entity.acceptsMarketing,
        acceptsReminders: entity.acceptsReminders,
        preferredLocale: entity.preferredLocale,
      })
      .returning();
    if (!row) throw new Error('No se pudieron crear las preferencias');
    return this.toDomain(row);
  }

  async update(entity: UserPreference): Promise<UserPreference> {
    const [row] = await this.db
      .update(userPreference)
      .set({
        onboardingCompleted: entity.onboardingCompleted,
        acceptsMarketing: entity.acceptsMarketing,
        acceptsReminders: entity.acceptsReminders,
        preferredLocale: entity.preferredLocale,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, entity.userId))
      .returning();
    if (!row) throw new Error('No se pudieron actualizar las preferencias');
    return this.toDomain(row);
  }

  private toDomain(row: PreferenceRow): UserPreference {
    return UserPreference.fromPersistence({
      id: row.id,
      userId: row.userId,
      onboardingCompleted: row.onboardingCompleted,
      acceptsMarketing: row.acceptsMarketing,
      acceptsReminders: row.acceptsReminders,
      preferredLocale: row.preferredLocale,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
