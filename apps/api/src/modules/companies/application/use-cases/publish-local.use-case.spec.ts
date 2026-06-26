import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { captureEvents } from '../../../../shared/testing/fakes/capture-events';
import { InMemoryLocalRepository } from '../../../../shared/testing/in-memory/companies';
import { LocalBuilder } from '../../../../shared/testing/builders/companies';
import { LocalNotFoundError, TenantForbiddenError } from '../../domain/errors/companies.errors';
import { PublishLocalUseCase } from './publish-local.use-case';

function build() {
  const locals = new InMemoryLocalRepository();
  const events = new EventBus();
  const useCase = new PublishLocalUseCase(locals, events);
  return { locals, events, useCase };
}

describe('PublishLocalUseCase', () => {
  it('super_admin publica el local (visible) y emite LocalPublishedEvent', async () => {
    const { locals, events, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').withCompanyId('c1').build());
    const captured = captureEvents(events, 'companies.local_published');

    const local = await useCase.execute({ localId: 'l1', isSuperAdmin: true });

    expect(local.status).toBe('active');
    expect(local.isVisible()).toBe(true);
    expect(captured.names()).toContain('companies.local_published');
    const event = captured.last();
    expect(event?.payload).toEqual({ localId: 'l1', companyId: 'c1' });
  });

  it('admin_local publica un local de SU empresa', async () => {
    const { locals, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').withCompanyId('c1').build());

    const local = await useCase.execute({
      localId: 'l1',
      isSuperAdmin: false,
      actorCompanyId: 'c1',
    });

    expect(local.status).toBe('active');
  });

  it('admin_local de otra empresa → TenantForbiddenError y no publica', async () => {
    const { locals, events, useCase } = build();
    await locals.create(new LocalBuilder().withId('l1').withCompanyId('c1').build());
    const captured = captureEvents(events, 'companies.local_published');

    await expect(
      useCase.execute({ localId: 'l1', isSuperAdmin: false, actorCompanyId: 'other' }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
    expect((await locals.findById('l1'))?.status).toBe('draft');
    expect(captured.events).toHaveLength(0);
  });

  it('local inexistente → LocalNotFoundError', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ localId: 'ghost', isSuperAdmin: true }),
    ).rejects.toBeInstanceOf(LocalNotFoundError);
  });
});
