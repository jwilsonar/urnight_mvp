import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { review } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { Review, type ReviewStatus, type TargetType } from '../../domain/entities/review.entity';
import type { ReviewRepository } from '../../domain/ports/review.repository';

type Row = typeof review.$inferSelect;

@Injectable()
export class DrizzleReviewRepository implements ReviewRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(entity: Review): Promise<Review> {
    const [row] = await this.db
      .insert(review)
      .values({
        id: entity.id,
        userId: entity.userId,
        targetType: entity.targetType,
        localId: entity.localId,
        eventId: entity.eventId,
        ticketId: entity.ticketId,
        rating: entity.rating,
        comment: entity.comment,
        quickTags: entity.quickTags,
        isVerified: entity.isVerified,
        status: entity.status,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la reseña');
    return this.toDomain(row);
  }

  async listByTarget(target: { localId?: string; eventId?: string }): Promise<Review[]> {
    const where = target.localId
      ? and(eq(review.localId, target.localId), eq(review.status, 'published'))
      : and(eq(review.eventId, target.eventId ?? ''), eq(review.status, 'published'));
    const rows = await this.db.select().from(review).where(where).orderBy(desc(review.createdAt));
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: Row): Review {
    return Review.fromPersistence({
      id: row.id,
      userId: row.userId,
      targetType: row.targetType as TargetType,
      localId: row.localId,
      eventId: row.eventId,
      ticketId: row.ticketId,
      rating: row.rating,
      comment: row.comment,
      quickTags: (row.quickTags as string[] | null) ?? null,
      isVerified: row.isVerified,
      isReported: row.isReported,
      status: row.status as ReviewStatus,
      createdAt: row.createdAt,
    });
  }
}
