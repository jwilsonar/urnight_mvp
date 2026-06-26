import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { promoterApplication } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import {
  PromoterApplication,
  type PromoterApplicationStatus,
} from '../../domain/entities/promoter-application.entity';
import type { PromoterApplicationRepository } from '../../domain/ports/promoter-application.repository';

type Row = typeof promoterApplication.$inferSelect;

@Injectable()
export class DrizzlePromoterApplicationRepository implements PromoterApplicationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(entity: PromoterApplication): Promise<PromoterApplication> {
    const [row] = await this.db
      .insert(promoterApplication)
      .values({
        id: entity.id,
        localId: entity.localId,
        name: entity.name,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        applicantUserId: entity.applicantUserId,
        status: entity.status,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la postulación');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<PromoterApplication | null> {
    const [row] = await this.db
      .select()
      .from(promoterApplication)
      .where(eq(promoterApplication.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async update(entity: PromoterApplication, tx?: unknown): Promise<PromoterApplication> {
    const [row] = await this.exec(tx)
      .update(promoterApplication)
      .set({
        status: entity.status,
        createdPromoterId: entity.createdPromoterId,
        reviewedAt: new Date(),
      })
      .where(eq(promoterApplication.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la postulación');
    return this.toDomain(row);
  }

  private toDomain(row: Row): PromoterApplication {
    return PromoterApplication.fromPersistence({
      id: row.id,
      localId: row.localId,
      eventId: row.eventId,
      applicantUserId: row.applicantUserId,
      name: row.name,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      socials: row.socials,
      status: row.status as PromoterApplicationStatus,
      reviewedBy: row.reviewedBy,
      createdPromoterId: row.createdPromoterId,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
    });
  }
}
