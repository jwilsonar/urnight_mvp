import type { SaleAttribution } from '../../../../modules/promoters/domain/entities/sale-attribution.entity';
import type { SaleAttributionRepository } from '../../../../modules/promoters/domain/ports/sale-attribution.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** SaleAttributionRepository en memoria. `existsForOrder` da idempotencia por orden. */
export class InMemorySaleAttributionRepository
  extends InMemoryRepository<SaleAttribution>
  implements SaleAttributionRepository
{
  /** Precarga una atribución sin pasar por un caso de uso. */
  seed(attribution: SaleAttribution): this {
    this.put(attribution);
    return this;
  }

  async existsForOrder(orderId: string): Promise<boolean> {
    return this.values().some((a) => a.orderId === orderId);
  }

  async create(attribution: SaleAttribution): Promise<void> {
    this.put(attribution);
  }

  async listByPromoter(promoterId: string): Promise<SaleAttribution[]> {
    return this.values().filter((a) => a.promoterId === promoterId);
  }
}
