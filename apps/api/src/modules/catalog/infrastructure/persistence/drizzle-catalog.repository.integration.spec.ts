import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, tag, zone } from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import type { CreateZoneInput, TaxonomyKind } from '../../domain/ports/catalog.repository';
import { DrizzleCatalogRepository } from './drizzle-catalog.repository';

let client: DbClient;
let repo: DrizzleCatalogRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleCatalogRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

function zoneInput(overrides: Partial<CreateZoneInput> = {}): CreateZoneInput {
  return {
    name: 'Miraflores',
    slug: 'miraflores',
    displayOrder: 0,
    isActive: true,
    ...overrides,
  };
}

describe('DrizzleCatalogRepository (integration)', () => {
  describe('zone', () => {
    it('round-trip: createZone persiste y listZones lo devuelve fiel', async () => {
      const created = await repo.createZone(
        zoneInput({ name: 'Barranco', slug: 'barranco', displayOrder: 3, isActive: false }),
      );

      expect(created.id).toBeTruthy();
      expect(created.name).toBe('Barranco');
      expect(created.slug).toBe('barranco');
      expect(created.displayOrder).toBe(3);
      expect(created.isActive).toBe(false);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const zones = await repo.listZones();
      expect(zones).toHaveLength(1);
      const found = zones[0];
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Barranco');
      expect(found?.slug).toBe('barranco');
      expect(found?.displayOrder).toBe(3);
      expect(found?.isActive).toBe(false);
    });

    it('UNIQUE slug: dos zonas con el mismo slug son rechazadas por la BD', async () => {
      await repo.createZone(zoneInput({ name: 'San Isidro', slug: 'centro' }));
      await expect(
        repo.createZone(zoneInput({ name: 'Surco', slug: 'centro' })),
      ).rejects.toThrow();
    });

    it('listZones ordena por displayOrder ascendente', async () => {
      await repo.createZone(zoneInput({ name: 'Tercero', slug: 'tercero', displayOrder: 30 }));
      await repo.createZone(zoneInput({ name: 'Primero', slug: 'primero', displayOrder: 10 }));
      await repo.createZone(zoneInput({ name: 'Segundo', slug: 'segundo', displayOrder: 20 }));

      const zones = await repo.listZones();
      expect(zones.map((z) => z.slug)).toEqual(['primero', 'segundo', 'tercero']);
    });

    it('listZones sin filas devuelve una lista vacía', async () => {
      expect(await repo.listZones()).toEqual([]);
    });
  });

  describe('taxonomy', () => {
    const kinds: TaxonomyKind[] = ['local_type', 'music_genre', 'tag'];

    for (const kind of kinds) {
      it(`round-trip: createTaxonomy(${kind}) persiste y listTaxonomy lo devuelve fiel`, async () => {
        const created = await repo.createTaxonomy(
          kind,
          zoneInput({ name: 'Disco', slug: `disco-${kind}`, displayOrder: 5, isActive: true }),
        );

        expect(created.id).toBeTruthy();
        expect(created.name).toBe('Disco');
        expect(created.slug).toBe(`disco-${kind}`);
        expect(created.displayOrder).toBe(5);
        expect(created.isActive).toBe(true);

        const items = await repo.listTaxonomy(kind);
        expect(items).toHaveLength(1);
        expect(items[0]?.id).toBe(created.id);
        expect(items[0]?.slug).toBe(`disco-${kind}`);
      });

      it(`UNIQUE slug: createTaxonomy(${kind}) duplicado es rechazado`, async () => {
        await repo.createTaxonomy(kind, zoneInput({ name: 'Rock', slug: `dup-${kind}` }));
        await expect(
          repo.createTaxonomy(kind, zoneInput({ name: 'Pop', slug: `dup-${kind}` })),
        ).rejects.toThrow();
      });

      it(`listTaxonomy(${kind}) ordena por displayOrder ascendente`, async () => {
        await repo.createTaxonomy(
          kind,
          zoneInput({ name: 'Tercero', slug: `c-${kind}`, displayOrder: 30 }),
        );
        await repo.createTaxonomy(
          kind,
          zoneInput({ name: 'Primero', slug: `a-${kind}`, displayOrder: 10 }),
        );
        await repo.createTaxonomy(
          kind,
          zoneInput({ name: 'Segundo', slug: `b-${kind}`, displayOrder: 20 }),
        );

        const items = await repo.listTaxonomy(kind);
        expect(items.map((i) => i.slug)).toEqual([`a-${kind}`, `b-${kind}`, `c-${kind}`]);
      });
    }

    it('las taxonomías están aisladas entre tablas (zone vs tag)', async () => {
      await repo.createZone(zoneInput({ name: 'Centro', slug: 'shared-slug' }));
      // Mismo slug en otra tabla NO colisiona (UNIQUE es por tabla).
      await repo.createTaxonomy('tag', zoneInput({ name: 'Centro', slug: 'shared-slug' }));

      expect(await repo.listZones()).toHaveLength(1);
      expect(await repo.listTaxonomy('tag')).toHaveLength(1);

      const zoneRows = await client.db.select().from(zone);
      const tagRows = await client.db.select().from(tag);
      expect(zoneRows).toHaveLength(1);
      expect(tagRows).toHaveLength(1);
    });
  });
});
