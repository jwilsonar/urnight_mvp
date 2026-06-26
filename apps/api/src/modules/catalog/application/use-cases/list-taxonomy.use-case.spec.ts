import { describe, expect, it } from 'vitest';
import { InMemoryCatalogRepository } from '../../../../shared/testing/in-memory/catalog';
import { ZoneBuilder } from '../../../../shared/testing/builders/catalog';
import type { TaxonomyKind } from '../../domain/ports/catalog.repository';
import { ListTaxonomyUseCase } from './list-taxonomy.use-case';

function build() {
  const repo = new InMemoryCatalogRepository();
  const useCase = new ListTaxonomyUseCase(repo);
  return { repo, useCase };
}

describe('ListTaxonomyUseCase', () => {
  const kinds: TaxonomyKind[] = ['local_type', 'music_genre', 'tag'];

  for (const kind of kinds) {
    it(`devuelve los ítems de la taxonomía "${kind}"`, async () => {
      const { repo, useCase } = build();
      repo.seedTaxonomy(kind, new ZoneBuilder().withName('Bar').withSlug('bar').build());

      const result = await useCase.execute(kind);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Bar');
    });
  }

  it('devuelve una lista vacía cuando la taxonomía no tiene ítems', async () => {
    const { useCase } = build();

    const result = await useCase.execute('tag');

    expect(result).toEqual([]);
  });

  it('aísla cada taxonomía: solo lista la solicitada', async () => {
    const { repo, useCase } = build();
    repo.seedTaxonomy('local_type', new ZoneBuilder().withName('Bar').withSlug('bar').build());
    repo.seedTaxonomy(
      'music_genre',
      new ZoneBuilder().withName('Salsa').withSlug('salsa').build(),
    );

    const result = await useCase.execute('local_type');

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Bar');
  });

  it('ordena los ítems por displayOrder ascendente', async () => {
    const { repo, useCase } = build();
    repo.seedTaxonomy(
      'tag',
      new ZoneBuilder().withName('Segundo').withSlug('segundo').withDisplayOrder(2).build(),
    );
    repo.seedTaxonomy(
      'tag',
      new ZoneBuilder().withName('Primero').withSlug('primero').withDisplayOrder(1).build(),
    );

    const result = await useCase.execute('tag');

    expect(result.map((z) => z.name)).toEqual(['Primero', 'Segundo']);
  });
});
