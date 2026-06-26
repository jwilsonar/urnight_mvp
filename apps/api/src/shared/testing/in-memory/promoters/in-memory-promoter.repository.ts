import type { Promoter } from '../../../../modules/promoters/domain/entities/promoter.entity';
import type { ReferralLink } from '../../../../modules/promoters/domain/entities/referral-link.entity';
import type { PromoterRepository } from '../../../../modules/promoters/domain/ports/promoter.repository';
import { InMemoryRepository } from '../in-memory.repository';
import { InMemoryReferralLinkRepository } from './in-memory-referral-link.repository';

/**
 * PromoterRepository en memoria. `create` persiste el promotor + su referral link
 * en una sola operación (como la Tx del adapter Drizzle); el link se delega al
 * `InMemoryReferralLinkRepository` para compartir el mismo almacén de links (así
 * `getLink` y `ReferralLinkRepository.findByCode` ven el mismo estado).
 */
export class InMemoryPromoterRepository
  extends InMemoryRepository<Promoter>
  implements PromoterRepository
{
  constructor(
    private readonly links: InMemoryReferralLinkRepository = new InMemoryReferralLinkRepository(),
  ) {
    super();
  }

  /** Precarga un promotor sin link (datos de referencia). */
  seed(promoter: Promoter): this {
    this.put(promoter);
    return this;
  }

  async create(promoter: Promoter, link: ReferralLink, _tx?: unknown): Promise<void> {
    this.put(promoter);
    this.links.seed(link);
  }

  async createPending(promoter: Promoter, _tx?: unknown): Promise<void> {
    this.put(promoter);
  }

  async update(promoter: Promoter, _tx?: unknown): Promise<void> {
    this.put(promoter);
  }

  async addLink(link: ReferralLink, _tx?: unknown): Promise<void> {
    this.links.seed(link);
  }

  async findPendingForActor(userId: string, email: string | null): Promise<Promoter[]> {
    return this.all.filter(
      (p) =>
        p.status === 'pending' &&
        (p.userId === userId || (!!email && p.invitedEmail === email)),
    );
  }

  async findById(id: string): Promise<Promoter | null> {
    return this.getById(id);
  }

  async findActiveByUserId(userId: string): Promise<Promoter | null> {
    return this.all.find((p) => p.userId === userId && p.status === 'active') ?? null;
  }

  async getLink(promoterId: string): Promise<ReferralLink | null> {
    return this.links.all.find((l) => l.promoterId === promoterId) ?? null;
  }

  async listByCompany(companyId: string | null): Promise<Promoter[]> {
    return this.all.filter((p) => companyId === null || p.companyId === companyId);
  }
}
