import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { affiliationRequest } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import {
  AffiliationRequest,
  type AffiliationStatus,
} from '../../domain/entities/affiliation-request.entity';
import type { AffiliationRequestRepository } from '../../domain/ports/affiliation-request.repository';

type Row = typeof affiliationRequest.$inferSelect;

@Injectable()
export class DrizzleAffiliationRequestRepository implements AffiliationRequestRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(entity: AffiliationRequest): Promise<AffiliationRequest> {
    const [row] = await this.db
      .insert(affiliationRequest)
      .values({
        id: entity.id,
        legalName: entity.legalName,
        ruc: entity.ruc,
        commercialName: entity.commercialName,
        zoneId: entity.zoneId,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        status: entity.status,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la solicitud');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<AffiliationRequest | null> {
    const [row] = await this.db
      .select()
      .from(affiliationRequest)
      .where(eq(affiliationRequest.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async update(entity: AffiliationRequest, tx?: unknown): Promise<AffiliationRequest> {
    const [row] = await this.exec(tx)
      .update(affiliationRequest)
      .set({
        status: entity.status,
        rejectionReason: entity.rejectionReason,
        companyId: entity.companyId,
        localId: entity.localId,
        reviewedAt: new Date(),
      })
      .where(eq(affiliationRequest.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la solicitud');
    return this.toDomain(row);
  }

  private toDomain(row: Row): AffiliationRequest {
    return AffiliationRequest.fromPersistence({
      id: row.id,
      legalName: row.legalName,
      ruc: row.ruc,
      commercialName: row.commercialName,
      zoneId: row.zoneId,
      address: row.address,
      socials: row.socials,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      status: row.status as AffiliationStatus,
      rejectionReason: row.rejectionReason,
      submittedBy: row.submittedBy,
      reviewedBy: row.reviewedBy,
      companyId: row.companyId,
      localId: row.localId,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
    });
  }
}
