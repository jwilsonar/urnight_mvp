import { describe, expect, it } from 'vitest';
import { TicketType } from './ticket-type.entity';
import { TicketTypeBuilder } from '../../../../shared/testing/builders/events';
import { TicketTypeMother } from '../../../../shared/testing/mothers/events';

describe('TicketType (aggregate, §4.1: sold <= stock)', () => {
  it('crea un tipo de entrada activo con los valores por defecto', () => {
    const ticket = TicketType.create({
      id: 't1',
      eventId: 'e1',
      name: '  General  ',
      tierCode: 'general',
      price: 50,
      currency: 'PEN',
      stock: 100,
    });

    expect(ticket.id).toBe('t1');
    expect(ticket.eventId).toBe('e1');
    expect(ticket.name).toBe('General'); // trim aplicado
    expect(ticket.tierCode).toBe('general');
    expect(ticket.price).toBe(50);
    expect(ticket.currency).toBe('PEN');
    expect(ticket.stock).toBe(100);
    expect(ticket.sold).toBe(0);
    expect(ticket.status).toBe('active');
    expect(ticket.maxPerUser).toBeNull();
  });

  it('respeta los valores opcionales recibidos en create', () => {
    const ticket = TicketType.create({
      id: 't2',
      eventId: 'e1',
      name: 'VIP',
      tierCode: 'vip',
      price: 150,
      currency: 'USD',
      stock: 20,
      maxPerUser: 4,
      saleStartsAt: new Date('2026-11-01T00:00:00.000Z'),
      saleEndsAt: new Date('2026-12-31T00:00:00.000Z'),
    });

    expect(ticket.tierCode).toBe('vip');
    expect(ticket.currency).toBe('USD');
    expect(ticket.maxPerUser).toBe(4);
  });

  it('hidrata desde persistencia con todos sus campos', () => {
    const ticket = TicketType.fromPersistence({
      id: 't3',
      eventId: 'e9',
      name: 'Premium',
      tierCode: 'premium',
      price: 250,
      currency: 'PEN',
      stock: 30,
      sold: 12,
      available: 18,
      maxPerUser: null,
      saleStartsAt: null,
      saleEndsAt: null,
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(ticket.tierCode).toBe('premium');
    expect(ticket.stock).toBe(30);
    expect(ticket.sold).toBe(12);
  });

  describe('remaining', () => {
    it('calcula stock menos vendidos', () => {
      const ticket = new TicketTypeBuilder().withStock(100).withSold(40).build();
      expect(ticket.remaining()).toBe(60);
    });

    it('es 0 cuando se vendió todo el stock', () => {
      const ticket = new TicketTypeBuilder().withStock(50).withSold(50).build();
      expect(ticket.remaining()).toBe(0);
    });

    it('resta los holds activos no vencidos además de los vendidos', () => {
      const ticket = new TicketTypeBuilder()
        .withStock(10)
        .withSold(4)
        .withActiveHolds(3)
        .build();
      expect(ticket.remaining()).toBe(3);
    });
  });

  describe('isAvailable', () => {
    it('está disponible si está activo y queda stock', () => {
      const ticket = new TicketTypeBuilder().withStock(10).withSold(3).withStatus('active').build();
      expect(ticket.isAvailable()).toBe(true);
    });

    it('no está disponible si está pausado aunque quede stock', () => {
      const ticket = new TicketTypeBuilder().withStock(10).withSold(3).asPaused().build();
      expect(ticket.isAvailable()).toBe(false);
    });

    it('no está disponible si está activo pero sin stock restante', () => {
      const ticket = new TicketTypeBuilder().withStock(10).withSold(10).withStatus('active').build();
      expect(ticket.isAvailable()).toBe(false);
    });

    it('no está disponible si está sold_out', () => {
      expect(TicketTypeMother.soldOut().isAvailable()).toBe(false);
    });
  });

  it('builder y mother producen un tipo de entrada general activo por defecto', () => {
    const ticket = new TicketTypeBuilder().build();
    expect(ticket.tierCode).toBe('general');
    expect(ticket.status).toBe('active');
    expect(TicketTypeMother.vip().tierCode).toBe('vip');
    expect(TicketTypeMother.premium().tierCode).toBe('premium');
  });
});
