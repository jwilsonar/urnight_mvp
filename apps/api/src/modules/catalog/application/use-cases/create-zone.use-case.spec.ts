import { describe, expect, it } from 'vitest';
import { InMemoryCatalogRepository } from '../../../../shared/testing/in-memory/catalog';
import type { CreateZoneInput } from '../../domain/ports/catalog.repository';
import { CreateZoneUseCase } from './create-zone.use-case';

function build() {
  const repo = new InMemoryCatalogRepository();
  const useCase = new CreateZoneUseCase(repo);
  return { repo, useCase };
}

const validInput: CreateZoneInput = {
  name: 'Miraflores',
  slug: 'miraflores',
  displayOrder: 1,
  isActive: true,
};

describe('CreateZoneUseCase', () => {
  it('crea una zona y la persiste en el repositorio', async () => {
    const { repo, useCase } = build();

    const result = await useCase.execute(validInput);

    expect(result.name).toBe('Miraflores');
    expect(result.slug).toBe('miraflores');
    expect(result.displayOrder).toBe(1);
    expect(result.isActive).toBe(true);
    expect(repo.size).toBe(1);
    expect(repo.all[0]?.name).toBe('Miraflores');
  });

  it('asigna id y timestamps a la zona creada (como hace la DB)', async () => {
    const { useCase } = build();

    const result = await useCase.execute(validInput);

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('la zona creada queda visible al listar', async () => {
    const { repo, useCase } = build();

    await useCase.execute(validInput);
    const zones = await repo.listZones();

    expect(zones).toHaveLength(1);
    expect(zones[0]?.slug).toBe('miraflores');
  });

  it('acepta crear una zona inactiva', async () => {
    const { useCase } = build();

    const result = await useCase.execute({ ...validInput, isActive: false });

    expect(result.isActive).toBe(false);
  });

  it('rechaza un name inválido (invariante de Zone)', async () => {
    const { useCase } = build();

    await expect(useCase.execute({ ...validInput, name: 'x' })).rejects.toThrow(
      'Zone.name inválido',
    );
  });
});
