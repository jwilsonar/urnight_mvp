import { describe, expect, it } from 'vitest';
import { InMemoryLocalRepository } from '../../../../shared/testing/in-memory/companies';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import { GetLocalUseCase } from './get-local.use-case';

function build() {
  const locals = new InMemoryLocalRepository();
  const useCase = new GetLocalUseCase(locals);
  return { locals, useCase };
}

describe('GetLocalUseCase', () => {
  it('devuelve el detalle del local por slug', async () => {
    const { locals, useCase } = build();
    await locals.create(new LocalBuilder().withSlug('aurora-barranco').asActive().build());

    const local = await useCase.execute('aurora-barranco');

    expect(local.slug).toBe('aurora-barranco');
    expect(local.status).toBe('active');
  });

  it('slug inexistente → LocalNotFoundError', async () => {
    const { useCase } = build();

    await expect(useCase.execute('no-existe')).rejects.toBeInstanceOf(LocalNotFoundError);
  });
});
