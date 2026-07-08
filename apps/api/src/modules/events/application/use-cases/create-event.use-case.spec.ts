import type { CreateEventDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { FakeEventTenant, FakeStorage, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import {
  EventFlyerInvalidError,
  EventFlyerNotFoundError,
  EventSlugTakenError,
} from '../../domain/errors/events.errors';
import { CreateEventUseCase } from './create-event.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const storage = new FakeStorage();
  const useCase = new CreateEventUseCase(events, new FakeEventTenant(), storage);
  return { events, storage, useCase };
}

function dto(overrides: Partial<CreateEventDto> = {}): CreateEventDto {
  return {
    localId: '11111111-1111-1111-1111-111111111111',
    name: 'Noche Techno',
    slug: 'noche-techno',
    startsAt: '2026-12-31T23:00:00.000Z',
    totalCapacity: 200,
    ...overrides,
  } as CreateEventDto;
}

describe('CreateEventUseCase', () => {
  it('crea un evento draft y lo persiste en el repositorio', async () => {
    const { events, useCase } = build();

    const result = await useCase.execute({ dto: dto(), createdBy: 'admin-1', scope: SUPER_ADMIN_SCOPE });

    expect(result.slug).toBe('noche-techno');
    expect(result.status).toBe('draft');
    expect(result.totalCapacity).toBe(200);
    expect(result.createdBy).toBe('admin-1');
    expect(events.size).toBe(1);
    expect(events.all[0]?.slug).toBe('noche-techno');
  });

  it('mapea las fechas y opcionales del DTO', async () => {
    const { useCase } = build();

    const result = await useCase.execute({
      dto: dto({
        description: 'Gran fiesta',
        endsAt: '2027-01-01T05:00:00.000Z',
        flyerUrl: 'https://cdn.test/f.png',
        dressCode: 'Elegante',
      }),
      createdBy: 'admin-1',
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.description).toBe('Gran fiesta');
    expect(result.startsAt).toEqual(new Date('2026-12-31T23:00:00.000Z'));
    expect(result.endsAt).toEqual(new Date('2027-01-01T05:00:00.000Z'));
    expect(result.flyerUrl).toBe('https://cdn.test/f.png');
    expect(result.dressCode).toBe('Elegante');
  });

  it('slug ya en uso → EventSlugTakenError', async () => {
    const { events, useCase } = build();
    await events.create(new EventBuilder().withSlug('noche-techno').build());

    await expect(
      useCase.execute({ dto: dto({ slug: 'noche-techno' }), createdBy: 'admin-1', scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventSlugTakenError);
    expect(events.size).toBe(1);
  });

  it('flyerKey válida → valida en staging, promueve a events/{id}/ y persiste la key final', async () => {
    const { events, storage, useCase } = build();
    storage.seed('tmp/abc123.jpg', { sizeBytes: 2048, contentType: 'image/jpeg' });

    const result = await useCase.execute({
      dto: dto({ flyerKey: 'tmp/abc123.jpg' }),
      createdBy: 'admin-1',
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.flyerUrl).toBe(`events/${result.id}/abc123.jpg`);
    expect(storage.has('tmp/abc123.jpg')).toBe(false); // staging limpiado
    expect(storage.has(`events/${result.id}/abc123.jpg`)).toBe(true);
    expect(events.all[0]?.flyerUrl).toBe(`events/${result.id}/abc123.jpg`);
  });

  it('flyerKey fuera de staging → EventFlyerInvalidError y no crea el evento', async () => {
    const { events, useCase } = build();

    await expect(
      useCase.execute({
        dto: dto({ flyerKey: 'events/otro/imagen.jpg' }),
        createdBy: 'admin-1',
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(EventFlyerInvalidError);
    expect(events.size).toBe(0);
  });

  it('flyerKey inexistente en storage → EventFlyerNotFoundError y no crea el evento', async () => {
    const { events, useCase } = build();

    await expect(
      useCase.execute({
        dto: dto({ flyerKey: 'tmp/no-existe.jpg' }),
        createdBy: 'admin-1',
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(EventFlyerNotFoundError);
    expect(events.size).toBe(0);
  });

  it('flyerKey con contentType no permitido → EventFlyerInvalidError y limpia staging', async () => {
    const { events, storage, useCase } = build();
    storage.seed('tmp/malo.gif', { contentType: 'image/gif' });

    await expect(
      useCase.execute({
        dto: dto({ flyerKey: 'tmp/malo.gif' }),
        createdBy: 'admin-1',
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(EventFlyerInvalidError);
    expect(events.size).toBe(0);
    expect(storage.has('tmp/malo.gif')).toBe(false);
  });
});
