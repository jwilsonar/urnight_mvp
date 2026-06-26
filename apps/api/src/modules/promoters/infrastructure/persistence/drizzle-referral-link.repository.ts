import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { referralLink } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { ReferralLink } from '../../domain/entities/referral-link.entity';
import type { ReferralLinkRepository } from '../../domain/ports/referral-link.repository';

type Row = typeof referralLink.$inferSelect;

@Injectable()
export class DrizzleReferralLinkRepository implements ReferralLinkRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByCode(code: string): Promise<ReferralLink | null> {
    const [row] = await this.db
      .select()
      .from(referralLink)
      .where(eq(referralLink.code, code))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async existsByCode(code: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: referralLink.id })
      .from(referralLink)
      .where(eq(referralLink.code, code))
      .limit(1);
    return Boolean(row);
  }

  async registerClick(code: string): Promise<void> {
    await this.db
      .update(referralLink)
      .set({ clicks: sql`${referralLink.clicks} + 1` })
      .where(eq(referralLink.code, code));
  }

  private toDomain(row: Row): ReferralLink {
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
