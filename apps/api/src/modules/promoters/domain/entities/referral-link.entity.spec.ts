import { describe, expect, it } from 'vitest';
import { ReferralLink } from './referral-link.entity';
import { ReferralLinkBuilder } from '../../../../shared/testing/builders/promoters';
import { ReferralLinkMother } from '../../../../shared/testing/mothers/promoters';

describe('ReferralLink (entity)', () => {
  it('create nace activo, con 0 clics y conserva código + url', () => {
    const link = ReferralLink.create({
      id: 'rl1',
      promoterId: 'p1',
      code: 'ABC123',
      url: 'https://urnight.pe/r/ABC123',
    });
    expect(link.id).toBe('rl1');
    expect(link.promoterId).toBe('p1');
    expect(link.code).toBe('ABC123');
    expect(link.url).toBe('https://urnight.pe/r/ABC123');
    expect(link.clicks).toBe(0);
    expect(link.isActive).toBe(true);
  });

  it('fromPersistence hidrata clics y estado de actividad', () => {
    const link = ReferralLink.fromPersistence({
      id: 'rl2',
      promoterId: 'p1',
      code: 'XYZ999',
      url: 'https://urnight.pe/r/XYZ999',
      clicks: 42,
      isActive: false,
    });
    expect(link.clicks).toBe(42);
    expect(link.isActive).toBe(false);
  });

  it('builder fija código y deriva la url coherente', () => {
    const link = new ReferralLinkBuilder().withCode('CODE42').build();
    expect(link.code).toBe('CODE42');
    expect(link.url).toBe('https://urnight.pe/r/CODE42');
  });

  it('mother inactive produce un link desactivado (no atribuible)', () => {
    expect(ReferralLinkMother.inactive().isActive).toBe(false);
    expect(ReferralLinkMother.active().isActive).toBe(true);
    expect(ReferralLinkMother.withClicks(7).clicks).toBe(7);
  });
});
