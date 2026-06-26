import { describe, expect, it } from 'vitest';
import {
  InMemoryPromoCodeRepository,
  InMemoryPromoterApplicationRepository,
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
  InMemorySaleAttributionRepository,
} from '../../shared/testing/in-memory/promoters';
import {
  PromoCodeBuilder,
  PromoterApplicationBuilder,
  PromoterBuilder,
  ReferralLinkBuilder,
  SaleAttributionBuilder,
} from '../../shared/testing/builders/promoters';
import {
  PromoCodeMother,
  PromoterApplicationMother,
  PromoterMother,
  ReferralLinkMother,
  SaleAttributionMother,
} from '../../shared/testing/mothers/promoters';

describe('Promoters in-memory repositories', () => {
  it('InMemoryPromoterRepository.create persiste promotor y link en el mismo almacén', async () => {
    const links = new InMemoryReferralLinkRepository();
    const promoters = new InMemoryPromoterRepository(links);
    const promoter = new PromoterBuilder().withId('p1').build();
    const link = new ReferralLinkBuilder().withPromoterId('p1').withCode('ABC').build();

    await promoters.create(promoter, link);

    expect(await promoters.findById('p1')).not.toBeNull();
    expect(await promoters.getLink('p1')).not.toBeNull();
    expect(await links.findByCode('ABC')).not.toBeNull(); // mismo almacén compartido
  });

  it('InMemoryReferralLinkRepository.registerClick incrementa y existsByCode detecta', async () => {
    const links = new InMemoryReferralLinkRepository();
    links.seed(new ReferralLinkBuilder().withCode('REF').withClicks(1).build());

    expect(await links.existsByCode('REF')).toBe(true);
    expect(await links.existsByCode('NOPE')).toBe(false);
    await links.registerClick('REF');
    expect((await links.findByCode('REF'))?.clicks).toBe(2);
  });

  it('InMemoryPromoterApplicationRepository create/update/findById', async () => {
    const apps = new InMemoryPromoterApplicationRepository();
    const app = new PromoterApplicationBuilder().withId('a1').build();

    await apps.create(app);
    expect(await apps.findById('a1')).not.toBeNull();

    app.approve('rev', 'p1');
    await apps.update(app);
    expect((await apps.findById('a1'))?.status).toBe('approved');
  });

  it('InMemorySaleAttributionRepository existsForOrder + listByPromoter', async () => {
    const sales = new InMemorySaleAttributionRepository();
    sales.seed(new SaleAttributionBuilder().withOrderId('o1').withPromoterId('p1').build());

    expect(await sales.existsForOrder('o1')).toBe(true);
    expect(await sales.existsForOrder('o2')).toBe(false);
    expect(await sales.listByPromoter('p1')).toHaveLength(1);
    expect(await sales.listByPromoter('p2')).toHaveLength(0);
  });

  it('InMemoryPromoCodeRepository findByCode/existsByCode/create', async () => {
    const codes = new InMemoryPromoCodeRepository();
    const created = await codes.create(new PromoCodeBuilder().withCode('NEW').build());

    expect(created.code).toBe('NEW');
    expect(await codes.findByCode('NEW')).not.toBeNull();
    expect(await codes.existsByCode('NEW')).toBe(true);
    expect(await codes.existsByCode('OLD')).toBe(false);
  });
});

describe('Promoters builders & mothers', () => {
  it('PromoterMother cubre los tres estados', () => {
    expect(PromoterMother.active().isActive()).toBe(true);
    expect(PromoterMother.inactive().status).toBe('inactive');
    expect(PromoterMother.suspended().status).toBe('suspended');
  });

  it('ReferralLinkMother y SaleAttributionMother exponen variantes coherentes', () => {
    expect(ReferralLinkMother.active().isActive).toBe(true);
    expect(ReferralLinkMother.inactive().isActive).toBe(false);
    expect(SaleAttributionMother.estimated().status).toBe('estimated');
    expect(SaleAttributionMother.confirmed().status).toBe('confirmed');
  });

  it('PromoterApplicationMother y PromoCodeMother exponen variantes coherentes', () => {
    expect(PromoterApplicationMother.pending().isPending()).toBe(true);
    expect(PromoterApplicationMother.approved().status).toBe('approved');
    expect(PromoCodeMother.percentage().discountType).toBe('percentage');
    expect(PromoCodeMother.fixedAmount().discountType).toBe('fixed_amount');
  });
});
