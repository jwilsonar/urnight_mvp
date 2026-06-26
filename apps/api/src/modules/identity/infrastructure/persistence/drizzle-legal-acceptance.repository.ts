import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { legalAcceptance } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { LegalAcceptance } from '../../domain/entities/legal-acceptance.entity';
import type { LegalAcceptanceRepository } from '../../domain/ports/legal.repository';

type LegalAcceptanceRow = typeof legalAcceptance.$inferSelect;

/** Adapter Drizzle del puerto LegalAcceptanceRepository. */
@Injectable()
export class DrizzleLegalAcceptanceRepository implements LegalAcceptanceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(entity: LegalAcceptance): Promise<LegalAcceptance> {
    const [row] = await this.db
      .insert(legalAcceptance)
      .values({
        id: entity.id,
        userId: entity.userId,
        legalDocumentId: entity.legalDocumentId,
        versionAccepted: entity.versionAccepted,
        ipAddress: entity.ipAddress,
        acceptedAt: entity.acceptedAt,
      })
      .returning();
    if (!row) throw new Error('No se pudo registrar la aceptación legal');
    return this.toDomain(row);
  }

  async findByUser(userId: string): Promise<LegalAcceptance[]> {
    const rows = await this.db
      .select()
      .from(legalAcceptance)
      .where(eq(legalAcceptance.userId, userId))
      .orderBy(desc(legalAcceptance.acceptedAt));
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: LegalAcceptanceRow): LegalAcceptance {
    return LegalAcceptance.fromPersistence({
      id: row.id,
      userId: row.userId,
      legalDocumentId: row.legalDocumentId,
      versionAccepted: row.versionAccepted,
      ipAddress: row.ipAddress,
      acceptedAt: row.acceptedAt,
    });
  }
}
