import { describe, expect, it } from 'vitest';
import { Promoter } from './promoter.entity';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import { PromoterMother } from '../../../../shared/testing/mothers/promoters';

describe('Promoter (aggregate)', () => {
  it('create nace en estado active y normaliza el nombre (trim)', () => {
    const promoter = Promoter.create({
      id: 'p1',
      companyId: 'c1',
      localId: 'l1',
      name: '  Promotor Centro  ',
    });
    expect(promoter.id).toBe('p1');
    expect(promoter.companyId).toBe('c1');
    expect(promoter.localId).toBe('l1');
    expect(promoter.name).toBe('Promotor Centro');
    expect(promoter.status).toBe('active');
    expect(promoter.isActive()).toBe(true);
    expect(promoter.createdAt).toBeInstanceOf(Date);
  });

  it('create aplica valores por defecto en campos opcionales (null)', () => {
    const promoter = Promoter.create({ id: 'p2', companyId: 'c1', name: 'Sin Local' });
    expect(promoter.localId).toBeNull();
  });

  it('isActive es false cuando el promotor está inactive (invariante de estado)', () => {
    const promoter = new PromoterBuilder().asInactive().build();
    expect(promoter.status).toBe('inactive');
    expect(promoter.isActive()).toBe(false);
  });

  it('isActive es false cuando el promotor está suspended (invariante de estado)', () => {
    const promoter = new PromoterBuilder().asSuspended().build();
    expect(promoter.status).toBe('suspended');
    expect(promoter.isActive()).toBe(false);
  });

  it('fromPersistence hidrata todos los campos sin tocar el estado', () => {
    const createdAt = new Date('2026-03-01T00:00:00Z');
    const promoter = Promoter.fromPersistence({
      id: 'p3',
      companyId: 'c9',
      localId: null,
      userId: 'u1',
      name: 'Hidratado',
      contactEmail: 'a@b.com',
      contactPhone: '+51999999999',
      invitedEmail: null,
      status: 'suspended',
      createdAt,
    });
    expect(promoter.status).toBe('suspended');
    expect(promoter.createdAt).toBe(createdAt);
  });

  it('mother expone los tres estados del promotor', () => {
    expect(PromoterMother.active().status).toBe('active');
    expect(PromoterMother.inactive().status).toBe('inactive');
    expect(PromoterMother.suspended().status).toBe('suspended');
    expect(PromoterMother.active().isActive()).toBe(true);
  });
});
