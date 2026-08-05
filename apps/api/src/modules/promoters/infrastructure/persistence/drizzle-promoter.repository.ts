import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { promoter, referralLink } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { Promoter, type PromoterStatus } from '../../domain/entities/promoter.entity';
import { ReferralLink } from '../../domain/entities/referral-link.entity';
import type { PromoterRepository } from '../../domain/ports/promoter.repository';

type PromoterRow = typeof promoter.$inferSelect;
type LinkRow = typeof referralLink.$inferSelect;

@Injectable()
export class DrizzlePromoterRepository implements PromoterRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  private promoterValues(entity: Promoter) {
    return {
      id: entity.id,
      companyId: entity.companyId,
      localId: entity.localId,
      userId: entity.userId,
      parentPromoterId: entity.parentPromoterId,
      name: entity.name,
      contactEmail: entity.contactEmail,
      contactPhone: entity.contactPhone,
      invitedEmail: entity.invitedEmail,
      status: entity.status,
    };
  }

  private linkValues(link: ReferralLink) {
    return {
      id: link.id,
      promoterId: link.promoterId,
      code: link.code,
      url: link.url,
      clicks: link.clicks,
      isActive: link.isActive,
    };
  }

  async create(entity: Promoter, link: ReferralLink, tx?: unknown): Promise<void> {
    const db = this.exec(tx);
    await db.insert(promoter).values(this.promoterValues(entity));
    await db.insert(referralLink).values(this.linkValues(link));
  }

  async createPending(entity: Promoter, tx?: unknown): Promise<void> {
    await this.exec(tx).insert(promoter).values(this.promoterValues(entity));
  }

  async update(entity: Promoter, tx?: unknown): Promise<void> {
    await this.exec(tx)
      .update(promoter)
      .set({
        userId: entity.userId,
        parentPromoterId: entity.parentPromoterId,
        status: entity.status,
      })
      .where(eq(promoter.id, entity.id));
  }

  async addLink(link: ReferralLink, tx?: unknown): Promise<void> {
    await this.exec(tx).insert(referralLink).values(this.linkValues(link));
  }

  async findById(id: string): Promise<Promoter | null> {
    const [row] = await this.db.select().from(promoter).where(eq(promoter.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<Promoter | null> {
    const [row] = await this.db
      .select()
      .from(promoter)
      .where(and(eq(promoter.userId, userId), eq(promoter.status, 'active')))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async listByCompany(companyId: string | null): Promise<Promoter[]> {
    const rows = companyId
      ? await this.db.select().from(promoter).where(eq(promoter.companyId, companyId))
      : await this.db.select().from(promoter);
    return rows.map((row) => this.toDomain(row));
  }

  async findPendingForActor(userId: string, email: string | null): Promise<Promoter[]> {
    const match = email
      ? or(eq(promoter.userId, userId), eq(promoter.invitedEmail, email))
      : eq(promoter.userId, userId);
    const rows = await this.db
      .select()
      .from(promoter)
      .where(and(eq(promoter.status, 'pending'), match));
    return rows.map((row) => this.toDomain(row));
  }

  async getLink(promoterId: string): Promise<ReferralLink | null> {
    const [row] = await this.db
      .select()
      .from(referralLink)
      .where(eq(referralLink.promoterId, promoterId))
      .limit(1);
    return row ? this.toLink(row) : null;
  }

  private toDomain(row: PromoterRow): Promoter {
    return Promoter.fromPersistence({
      id: row.id,
      companyId: row.companyId,
      localId: row.localId,
      userId: row.userId,
      parentPromoterId: row.parentPromoterId,
      name: row.name,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      invitedEmail: row.invitedEmail,
      status: row.status as PromoterStatus,
      createdAt: row.createdAt,
    });
  }

  private toLink(row: LinkRow): ReferralLink {
    return ReferralLink.fromPersistence({
      id: row.id,
      promoterId: row.promoterId,
      code: row.code,
      url: row.url,
      clicks: row.clicks,
      isActive: row.isActive,
    });
  }
}
