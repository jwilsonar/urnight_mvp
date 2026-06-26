import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { localVerification } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import {
  LocalVerification,
  type VerificationStatus,
} from '../../domain/entities/local-verification.entity';
import type { LocalVerificationRepository } from '../../domain/ports/local-verification.repository';

type Row = typeof localVerification.$inferSelect;

@Injectable()
export class DrizzleLocalVerificationRepository implements LocalVerificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(entity: LocalVerification): Promise<LocalVerification> {
    const [row] = await this.db
      .insert(localVerification)
      .values({
        id: entity.id,
        localId: entity.localId,
        status: entity.status,
        licenseReference: entity.licenseReference,
        validUntil: entity.validUntil,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la verificación');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<LocalVerification | null> {
    const [row] = await this.db
      .select()
      .from(localVerification)
      .where(eq(localVerification.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async update(entity: LocalVerification): Promise<LocalVerification> {
    const [row] = await this.db
      .update(localVerification)
      .set({ status: entity.status })
      .where(eq(localVerification.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la verificación');
    return this.toDomain(row);
  }

  private toDomain(row: Row): LocalVerification {
    return LocalVerification.fromPersistence({
      id: row.id,
      localId: row.localId,
      status: row.status as VerificationStatus,
      licenseReference: row.licenseReference,
      documentUrl: row.documentUrl,
      notes: row.notes,
      verifiedBy: row.verifiedBy,
      validUntil: row.validUntil,
      createdAt: row.createdAt,
    });
  }
}
