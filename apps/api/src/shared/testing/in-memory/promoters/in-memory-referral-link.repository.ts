import { ReferralLink } from '../../../../modules/promoters/domain/entities/referral-link.entity';
import type { ReferralLinkRepository } from '../../../../modules/promoters/domain/ports/referral-link.repository';
import { InMemoryRepository } from '../in-memory.repository';

/**
 * ReferralLinkRepository en memoria. Almacena los links por `id` (base genérica)
 * y los busca por `code` (índice secundario lógico, como hace el adapter Drizzle).
 * `registerClick` incrementa el contador reconstituyendo la entidad vía
 * `fromPersistence` (los getters del dominio son de solo lectura).
 */
export class InMemoryReferralLinkRepository
  extends InMemoryRepository<ReferralLink>
  implements ReferralLinkRepository
{
  /** Precarga un link sin pasar por un caso de uso (datos de referencia). */
  seed(link: ReferralLink): this {
    this.put(link);
    return this;
  }

  async findByCode(code: string): Promise<ReferralLink | null> {
    return this.values().find((l) => l.code === code) ?? null;
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.values().some((l) => l.code === code);
  }

  async registerClick(code: string): Promise<void> {
    const link = this.values().find((l) => l.code === code);
    if (!link) return;
    this.put(
      ReferralLink.fromPersistence({
        id: link.id,
        promoterId: link.promoterId,
        code: link.code,
        url: link.url,
        clicks: link.clicks + 1,
        isActive: link.isActive,
      }),
    );
  }
}
