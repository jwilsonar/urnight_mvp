import type { Review } from '../../../../modules/trust/domain/entities/review.entity';
import type { ReviewRepository } from '../../../../modules/trust/domain/ports/review.repository';
import { InMemoryRepository } from '../in-memory.repository';

/**
 * ReviewRepository en memoria. Replica el adapter Drizzle: `create` persiste y
 * devuelve la entidad; `listByTarget` filtra por local/evento Y `status='published'`
 * y ordena por `createdAt` descendente (igual que `orderBy(desc(createdAt))`).
 */
export class InMemoryReviewRepository
  extends InMemoryRepository<Review>
  implements ReviewRepository
{
  /** Precarga una reseña sin pasar por `create` (datos de prueba). */
  seed(review: Review): this {
    this.put(review);
    return this;
  }

  async create(review: Review): Promise<Review> {
    this.put(review);
    return review;
  }

  async listByTarget(target: { localId?: string; eventId?: string }): Promise<Review[]> {
    const matches = this.values().filter((r) => {
      if (r.status !== 'published') return false;
      return target.localId ? r.localId === target.localId : r.eventId === target.eventId;
    });
    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
