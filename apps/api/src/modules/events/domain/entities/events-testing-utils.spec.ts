import { describe, expect, it } from 'vitest';
import {
  InMemoryEventRepository,
  InMemoryTicketTypeRepository,
} from '../../../../shared/testing/in-memory/events';
import {
  EventBuilder,
  TicketTypeBuilder,
} from '../../../../shared/testing/builders/events';
import {
  EventMother,
  TicketTypeMother,
} from '../../../../shared/testing/mothers/events';

describe('InMemoryEventRepository', () => {
  it('create + findById recuperan el evento', async () => {
    const repo = new InMemoryEventRepository();
    await repo.create(new EventBuilder().withId('e1').build());
    expect((await repo.findById('e1'))?.id).toBe('e1');
    expect(await repo.findById('ghost')).toBeNull();
  });

  it('findBySlug y existsBySlug resuelven por slug', async () => {
    const repo = new InMemoryEventRepository();
    await repo.create(new EventBuilder().withSlug('mi-slug').build());
    expect((await repo.findBySlug('mi-slug'))?.slug).toBe('mi-slug');
    expect(await repo.findBySlug('otro')).toBeNull();
    expect(await repo.existsBySlug('mi-slug')).toBe(true);
    expect(await repo.existsBySlug('otro')).toBe(false);
  });

  it('listPublished solo devuelve publicados y filtra por local', async () => {
    const repo = new InMemoryEventRepository();
    await repo.create(new EventBuilder().withSlug('a').withLocalId('l1').asPublished().build());
    await repo.create(new EventBuilder().withSlug('b').withLocalId('l2').asPublished().build());
    await repo.create(new EventBuilder().withSlug('c').withStatus('draft').build());

    expect(await repo.listPublished()).toHaveLength(2);
    expect(await repo.listPublished({ localId: 'l1' })).toHaveLength(1);
    expect((await repo.listPublished({ localId: 'l1' }))[0]?.event.localId).toBe('l1');
  });

  it('update reemplaza el evento existente', async () => {
    const repo = new InMemoryEventRepository();
    await repo.create(new EventBuilder().withId('e1').withStatus('draft').build());
    await repo.update(new EventBuilder().withId('e1').asPublished().build());
    expect((await repo.findById('e1'))?.status).toBe('published');
    expect(repo.size).toBe(1);
  });
});

describe('InMemoryTicketTypeRepository', () => {
  it('create + findById recuperan el tipo de entrada', async () => {
    const repo = new InMemoryTicketTypeRepository();
    await repo.create(new TicketTypeBuilder().withId('t1').build());
    expect((await repo.findById('t1'))?.id).toBe('t1');
    expect(await repo.findById('ghost')).toBeNull();
  });

  it('listByEvent filtra por evento', async () => {
    const repo = new InMemoryTicketTypeRepository();
    await repo.create(new TicketTypeBuilder().withId('t1').withEventId('e1').build());
    await repo.create(new TicketTypeBuilder().withId('t2').withEventId('e2').build());
    expect(await repo.listByEvent('e1')).toHaveLength(1);
  });
});

describe('Builders y Mothers de Events', () => {
  it('EventBuilder produce draft por defecto y aplica overrides', () => {
    const event = new EventBuilder().withName('  Espacios  ').withTotalCapacity(50).build();
    expect(event.status).toBe('draft');
    expect(event.name).toBe('Espacios');
    expect(event.totalCapacity).toBe(50);
  });

  it('EventMother expone los estados clave', () => {
    expect(EventMother.draft().status).toBe('draft');
    expect(EventMother.published().status).toBe('published');
    expect(EventMother.cancelled().status).toBe('cancelled');
    expect(EventMother.finished().status).toBe('finished');
  });

  it('TicketTypeBuilder produce general activo por defecto', () => {
    const ticket = new TicketTypeBuilder().build();
    expect(ticket.tierCode).toBe('general');
    expect(ticket.status).toBe('active');
    expect(ticket.sold).toBe(0);
  });

  it('TicketTypeMother expone tiers y estados', () => {
    expect(TicketTypeMother.general().tierCode).toBe('general');
    expect(TicketTypeMother.vip().tierCode).toBe('vip');
    expect(TicketTypeMother.premium().tierCode).toBe('premium');
    expect(TicketTypeMother.soldOut().isAvailable()).toBe(false);
    expect(TicketTypeMother.paused().status).toBe('paused');
  });
});
