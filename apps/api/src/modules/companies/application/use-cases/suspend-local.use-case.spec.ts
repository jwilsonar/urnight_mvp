import { describe, expect, it } from 'vitest';
import { InMemoryLocalRepository } from '../../../../shared/testing/in-memory/companies';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import { SuspendLocalUseCase } from './suspend-local.use-case';

function build() {
  const locals = new InMemoryLocalRepository();
  const useCase = new SuspendLocalUseCase(locals);
  return { locals, useCase };
}

describe('SuspendLocalUseCase', () => {
  it('suspende un local activo dejándolo no visible y persiste el cambio', async () => {
    const { locals, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').asActive().build());

    const local = await useCase.execute({
      localId: 'l1',
      reason: 'Reportado por usuarios',
      isSuperAdmin: true,
    });

    expect(local.status).toBe('suspended');
    expect(local.isVisible()).toBe(false);
    expect((await locals.findById('l1'))?.status).toBe('suspended');
  });

  it('local inexistente → LocalNotFoundError', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ localId: 'ghost', reason: 'x', isSuperAdmin: true }),
    ).rejects.toBeInstanceOf(LocalNotFoundError);
  });
});
