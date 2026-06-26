import { describe, expect, it } from 'vitest';
import {
  InMemoryAnalyticsEventRepository,
  InMemoryNotificationRepository,
  InMemoryPlatformSettingRepository,
  InMemorySupportTicketRepository,
} from '../../../../shared/testing/in-memory/ops';
import {
  PlatformSettingBuilder,
  SupportTicketBuilder,
} from '../../../../shared/testing/builders/ops';
import {
  PlatformSettingMother,
  SupportTicketMother,
} from '../../../../shared/testing/mothers/ops';

describe('InMemoryPlatformSettingRepository', () => {
  it('upsert + findByKey: la key es la clave de unicidad', async () => {
    const repo = new InMemoryPlatformSettingRepository();
    await repo.upsert(new PlatformSettingBuilder().withKey('a.b').withValue('1').build());
    await repo.upsert(new PlatformSettingBuilder().withKey('a.b').withValue('2').build());

    expect(repo.size).toBe(1);
    expect((await repo.findByKey('a.b'))?.value).toBe('2');
  });

  it('seed precarga sin pasar por upsert y findByKey devuelve null si no existe', async () => {
    const repo = new InMemoryPlatformSettingRepository().seed(PlatformSettingMother.numberSetting());
    expect((await repo.findByKey('checkout.max_tickets'))?.valueType).toBe('number');
    expect(await repo.findByKey('no.existe')).toBeNull();
  });
});

describe('InMemorySupportTicketRepository', () => {
  it('create + findById + update reflejan el estado', async () => {
    const repo = new InMemorySupportTicketRepository();
    const ticket = new SupportTicketBuilder().withId('t1').withStatus('open').build();
    await repo.create(ticket);

    expect(repo.size).toBe(1);
    expect((await repo.findById('t1'))?.status).toBe('open');

    ticket.changeStatus('resolved');
    await repo.update(ticket);
    expect((await repo.findById('t1'))?.status).toBe('resolved');
  });

  it('findById devuelve null para un id desconocido', async () => {
    const repo = new InMemorySupportTicketRepository().seed(SupportTicketMother.open());
    expect(await repo.findById('ghost')).toBeNull();
  });
});

describe('InMemoryNotificationRepository', () => {
  it('listByUser filtra por usuario y ordena por createdAt desc', async () => {
    const repo = new InMemoryNotificationRepository();
    repo.seed('u1', {
      id: 'old',
      channel: 'email',
      type: 't',
      subject: null,
      status: 'sent',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    repo.seed('u1', {
      id: 'new',
      channel: 'push',
      type: 't',
      subject: null,
      status: 'queued',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    });
    repo.seed('u2', {
      id: 'other',
      channel: 'email',
      type: 't',
      subject: null,
      status: 'failed',
      createdAt: new Date('2026-03-01T00:00:00Z'),
    });

    const result = await repo.listByUser('u1');
    expect(result.map((n) => n.id)).toEqual(['new', 'old']);
  });
});

describe('InMemoryAnalyticsEventRepository', () => {
  it('record acumula eventos y byName/last permiten verificarlos', async () => {
    const repo = new InMemoryAnalyticsEventRepository();
    await repo.record({
      id: 'a1',
      userId: 'u1',
      sessionId: null,
      eventName: 'checkout_started',
      eventId: null,
      localId: null,
      zoneId: null,
      properties: null,
    });

    expect(repo.size).toBe(1);
    expect(repo.byName('checkout_started')?.id).toBe('a1');
    expect(repo.last()?.eventName).toBe('checkout_started');
  });
});
