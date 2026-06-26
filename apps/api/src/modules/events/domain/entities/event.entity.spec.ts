import { describe, expect, it } from 'vitest';
import { Event } from './event.entity';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { EventMother } from '../../../../shared/testing/mothers/events';

describe('Event (aggregate, §4.1)', () => {
  it('crea un evento en estado draft con los valores por defecto', () => {
    const event = Event.create({
      id: 'e1',
      localId: 'l1',
      name: '  Noche Techno  ',
      slug: 'noche-techno',
      startsAt: new Date('2026-12-31T23:00:00.000Z'),
    });

    expect(event.id).toBe('e1');
    expect(event.localId).toBe('l1');
    expect(event.name).toBe('Noche Techno'); // trim aplicado
    expect(event.slug).toBe('noche-techno');
    expect(event.status).toBe('draft');
    expect(event.ticketsSold).toBe(0);
    expect(event.totalCapacity).toBe(0);
    expect(event.minAgeNote).toBe('+18');
    expect(event.description).toBeNull();
    expect(event.endsAt).toBeNull();
    expect(event.flyerUrl).toBeNull();
    expect(event.dressCode).toBeNull();
    expect(event.createdBy).toBeNull();
    expect(event.publishedAt).toBeNull();
  });

  it('respeta los valores opcionales recibidos en create', () => {
    const event = Event.create({
      id: 'e2',
      localId: 'l1',
      name: 'Festival',
      slug: 'festival',
      description: 'Gran festival',
      endsAt: new Date('2027-01-01T05:00:00.000Z'),
      flyerUrl: 'https://cdn.test/flyer.png',
      startsAt: new Date('2026-12-31T23:00:00.000Z'),
      totalCapacity: 500,
      minAgeNote: '+21',
      dressCode: 'Elegante',
      createdBy: 'admin-1',
    });

    expect(event.description).toBe('Gran festival');
    expect(event.flyerUrl).toBe('https://cdn.test/flyer.png');
    expect(event.totalCapacity).toBe(500);
    expect(event.minAgeNote).toBe('+21');
    expect(event.dressCode).toBe('Elegante');
    expect(event.createdBy).toBe('admin-1');
    expect(event.endsAt).toEqual(new Date('2027-01-01T05:00:00.000Z'));
  });

  it('hidrata desde persistencia con todos sus campos', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const publishedAt = new Date('2026-02-01T00:00:00.000Z');
    const event = Event.fromPersistence({
      id: 'e3',
      localId: 'l9',
      name: 'Hidratado',
      slug: 'hidratado',
      description: null,
      startsAt: createdAt,
      endsAt: null,
      flyerUrl: null,
      totalCapacity: 100,
      ticketsSold: 40,
      checkinsCount: 5,
      status: 'published',
      minAgeNote: '+18',
      dressCode: null,
      customTags: ['DJ Peligro'],
      createdBy: 'admin',
      publishedAt,
      createdAt,
      updatedAt: createdAt,
    });

    expect(event.customTags).toEqual(['DJ Peligro']);
    expect(event.status).toBe('published');
    expect(event.ticketsSold).toBe(40);
    expect(event.publishedAt).toEqual(publishedAt);
    expect(event.createdAt).toEqual(createdAt);
  });

  describe('máquina de estados de publicación', () => {
    it('canPublish es true para draft/scheduled/published', () => {
      expect(new EventBuilder().withStatus('draft').build().canPublish()).toBe(true);
      expect(new EventBuilder().withStatus('scheduled').build().canPublish()).toBe(true);
      expect(new EventBuilder().withStatus('published').build().canPublish()).toBe(true);
    });

    it('canPublish es false para cancelled', () => {
      expect(EventMother.cancelled().canPublish()).toBe(false);
    });

    it('canPublish es false para finished', () => {
      expect(EventMother.finished().canPublish()).toBe(false);
    });

    it('publish marca published y fija publishedAt', () => {
      const event = EventMother.draft();
      expect(event.publishedAt).toBeNull();
      event.publish();
      expect(event.status).toBe('published');
      expect(event.publishedAt).not.toBeNull();
    });

    it('cancel marca cancelled', () => {
      const event = EventMother.draft();
      event.cancel();
      expect(event.status).toBe('cancelled');
    });

    it('isOnSale solo es true cuando está published', () => {
      expect(EventMother.published().isOnSale()).toBe(true);
      expect(EventMother.draft().isOnSale()).toBe(false);
      expect(EventMother.cancelled().isOnSale()).toBe(false);
    });
  });

  describe('aforo (hasCapacityFor)', () => {
    it('aforo ilimitado (totalCapacity=0) siempre tiene capacidad', () => {
      const event = new EventBuilder().withTotalCapacity(0).withTicketsSold(999).build();
      expect(event.hasCapacityFor(1000)).toBe(true);
    });

    it('tiene capacidad cuando vendidos + qty <= aforo', () => {
      const event = new EventBuilder().withTotalCapacity(100).withTicketsSold(90).build();
      expect(event.hasCapacityFor(10)).toBe(true);
    });

    it('no tiene capacidad cuando vendidos + qty supera el aforo', () => {
      const event = new EventBuilder().withTotalCapacity(100).withTicketsSold(90).build();
      expect(event.hasCapacityFor(11)).toBe(false);
    });
  });

  it('builder y mother producen un evento draft por defecto', () => {
    expect(new EventBuilder().build().status).toBe('draft');
    expect(EventMother.draft().status).toBe('draft');
    expect(EventMother.published().status).toBe('published');
  });
});
