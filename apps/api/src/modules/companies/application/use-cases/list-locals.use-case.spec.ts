import { describe, expect, it } from 'vitest';
import { InMemoryLocalRepository } from '../../../../shared/testing/in-memory/companies';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { ListLocalsUseCase } from './list-locals.use-case';

function build() {
  const locals = new InMemoryLocalRepository();
  const useCase = new ListLocalsUseCase(locals);
  return { locals, useCase };
}

describe('ListLocalsUseCase', () => {
  it('lista solo locales visibles (status=active), ocultando borradores/suspendidos', async () => {
    const { locals, useCase } = build();
    await locals.create(new LocalBuilder().withSlug('activo').asActive().build());
    await locals.create(new LocalBuilder().withSlug('borrador').build());
    await locals.create(new LocalBuilder().withSlug('suspendido').suspended().build());

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('activo');
  });

  it('filtra los visibles por zona', async () => {
    const { locals, useCase } = build();
    await locals.create(
      new LocalBuilder().withSlug('zona-a').withZoneId('zone-a').asActive().build(),
    );
    await locals.create(
      new LocalBuilder().withSlug('zona-b').withZoneId('zone-b').asActive().build(),
    );

    const result = await useCase.execute({ zoneId: 'zone-a' });

    expect(result).toHaveLength(1);
    expect(result[0]?.zoneId).toBe('zone-a');
  });

  it('devuelve lista vacía cuando no hay locales visibles', async () => {
    const { useCase } = build();

    expect(await useCase.execute()).toEqual([]);
  });
});
