import type { PromoterApplication } from '../../../../modules/promoters/domain/entities/promoter-application.entity';
import type { PromoterApplicationRepository } from '../../../../modules/promoters/domain/ports/promoter-application.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** PromoterApplicationRepository en memoria. `create`/`update` ignoran el `tx`. */
export class InMemoryPromoterApplicationRepository
  extends InMemoryRepository<PromoterApplication>
  implements PromoterApplicationRepository
{
  /** Precarga una postulación sin pasar por un caso de uso. */
  seed(application: PromoterApplication): this {
    this.put(application);
    return this;
  }

  async create(application: PromoterApplication): Promise<PromoterApplication> {
    this.put(application);
    return application;
  }

  async findById(id: string): Promise<PromoterApplication | null> {
    return this.getById(id);
  }

  async update(application: PromoterApplication, _tx?: unknown): Promise<PromoterApplication> {
    this.put(application);
    return application;
  }
}
