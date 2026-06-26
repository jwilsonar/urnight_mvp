import { describe, expect, it } from 'vitest';
import { Zone } from '../../domain/entities/zone.entity';
import type {
  CatalogRepository,
  CreateZoneInput,
} from '../../domain/ports/catalog.repository';
import { ListZonesUseCase } from './list-zones.use-case';

/** Repo en memoria (§6: dominio/aplicación se testean sin DB). */
class InMemoryCatalogRepository implements CatalogRepository {
  private zones: Zone[] = [];

  seed(zone: Zone): void {
    this.zones.push(zone);
  }

  async listZones(): Promise<Zone[]> {
    return this.zones;
  }

  async createZone(_input: CreateZoneInput): Promise<Zone> {
    throw new Error('no usado en este test');
  }

  async listTaxonomy(): Promise<Zone[]> {
    return [];
  }

  async createTaxonomy(): Promise<Zone> {
    throw new Error('no usado en este test');
  }
}

describe('ListZonesUseCase', () => {
  it('devuelve las zonas del repositorio', async () => {
    const repo = new InMemoryCatalogRepository();
    const now = new Date();
    repo.seed(
      Zone.fromPersistence({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Miraflores',
        slug: 'miraflores',
        displayOrder: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const result = await new ListZonesUseCase(repo).execute();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Miraflores');
  });
});
