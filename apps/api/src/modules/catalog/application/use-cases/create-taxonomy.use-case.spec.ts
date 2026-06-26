import { describe, expect, it } from 'vitest';
import { InMemoryCatalogRepository } from '../../../../shared/testing/in-memory/catalog';
import type {
  CreateZoneInput,
  TaxonomyKind,
} from '../../domain/ports/catalog.repository';
import { CreateTaxonomyUseCase } from './create-taxonomy.use-case';

function build() {
  const repo = new InMemoryCatalogRepository();
  const useCase = new CreateTaxonomyUseCase(repo);
  return { repo, useCase };
}

const validInput: CreateZoneInput = {
  name: 'Bar',
  slug: 'bar',
  displayOrder: 0,
  isActive: true,
};

describe('CreateTaxonomyUseCase', () => {
  const kinds: TaxonomyKind[] = ['local_type', 'music_genre', 'tag'];

  for (const kind of kinds) {
    it(`crea un ítem de la taxonomía "${kind}" y lo persiste en su bucket`, async () => {
      const { repo, useCase } = build();

      const result = await useCase.execute(kind, validInput);

      expect(result.name).toBe('Bar');
      expect(result.slug).toBe('bar');
      expect(repo.taxonomySize(kind)).toBe(1);
      const listed = await repo.listTaxonomy(kind);
      expect(listed[0]?.name).toBe('Bar');
    });
  }

  it('no contamina otras taxonomías ni el bucket de zonas', async () => {
    const { repo, useCase } = build();

    await useCase.execute('local_type', validInput);

    expect(repo.taxonomySize('local_type')).toBe(1);
    expect(repo.taxonomySize('music_genre')).toBe(0);
    expect(repo.taxonomySize('tag')).toBe(0);
    expect(repo.size).toBe(0);
  });

  it('asigna id y timestamps al ítem creado', async () => {
    const { useCase } = build();

    const result = await useCase.execute('tag', validInput);

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('acepta crear un ítem inactivo', async () => {
    const { useCase } = build();

    const result = await useCase.execute('music_genre', { ...validInput, isActive: false });

    expect(result.isActive).toBe(false);
  });

  it('rechaza un name inválido (invariante de Zone)', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute('tag', { ...validInput, name: 'x' }),
    ).rejects.toThrow('Zone.name inválido');
  });
});
