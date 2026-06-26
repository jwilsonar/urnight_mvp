import type { Local } from '../../../../modules/companies/domain/entities/local.entity';
import type {
  LocalListFilter,
  LocalRepository,
} from '../../../../modules/companies/domain/ports/local.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** LocalRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryLocalRepository
  extends InMemoryRepository<Local>
  implements LocalRepository
{
  async findById(id: string): Promise<Local | null> {
    return this.getById(id);
  }

  async findBySlug(slug: string): Promise<Local | null> {
    return this.values().find((l) => l.slug === slug) ?? null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.values().some((l) => l.slug === slug);
  }

  /** Locales públicos visibles (status=active), opcional por zona. */
  async listVisible(filter?: LocalListFilter): Promise<Local[]> {
    const q = filter?.q?.toLowerCase();
    return this.values().filter((l) => {
      if (!l.isVisible()) return false;
      if (filter?.zoneId !== undefined && l.zoneId !== filter.zoneId) return false;
      if (q && !`${l.name} ${l.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  async listOwned(companyId: string | null): Promise<Local[]> {
    return this.values().filter((l) => companyId === null || l.companyId === companyId);
  }

  async create(local: Local, _tx?: unknown): Promise<Local> {
    this.put(local);
    return local;
  }

  async update(local: Local): Promise<Local> {
    this.put(local);
    return local;
  }

  async setMainImageKey(_localId: string, _key: string | null): Promise<void> {
    // No-op: el fake no denormaliza la portada (sin tests que lo cubran aún).
  }
}
