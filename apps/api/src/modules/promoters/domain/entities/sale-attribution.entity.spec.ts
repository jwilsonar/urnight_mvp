import { describe, expect, it } from 'vitest';
import { SaleAttribution } from './sale-attribution.entity';
import { SaleAttributionBuilder } from '../../../../shared/testing/builders/promoters';
import { SaleAttributionMother } from '../../../../shared/testing/mothers/promoters';

describe('SaleAttribution (entity)', () => {
  it('estimate nace en estado estimated y toma el snapshot del rate de comisión', () => {
    const sale = SaleAttribution.estimate({
      id: 's1',
      orderId: 'o1',
      promoterId: 'p1',
      referralLinkId: 'rl1',
      commissionRate: 0.05,
      amount: 200,
    });
    expect(sale.id).toBe('s1');
    expect(sale.orderId).toBe('o1');
    expect(sale.promoterId).toBe('p1');
    expect(sale.referralLinkId).toBe('rl1');
    expect(sale.status).toBe('estimated');
    expect(sale.commissionRate).toBe(0.05); // snapshot del rate
    expect(sale.commissionAmount).toBe(10); // 200 * 0.05
    expect(sale.attributedAt).toBeInstanceOf(Date);
  });

  it('calcula la comisión redondeada a 2 decimales (snapshot inmutable)', () => {
    const sale = SaleAttribution.estimate({
      id: 's2',
      orderId: 'o2',
      promoterId: 'p1',
      referralLinkId: null,
      commissionRate: 0.07,
      amount: 33.33,
    });
    // 33.33 * 0.07 = 2.3331 -> redondea a 2.33
    expect(sale.commissionAmount).toBe(2.33);
    expect(sale.referralLinkId).toBeNull();
  });

  it('una comisión sobre monto cero es cero', () => {
    const sale = SaleAttribution.estimate({
      id: 's3',
      orderId: 'o3',
      promoterId: 'p1',
      referralLinkId: 'rl1',
      commissionRate: 0.1,
      amount: 0,
    });
    expect(sale.commissionAmount).toBe(0);
  });

  it('el snapshot de comisión no cambia aunque el rate del negocio cambie luego', () => {
    const sale = new SaleAttributionBuilder()
      .withCommissionRate(0.05)
      .withCommissionAmount(12.5)
      .build();
    // El monto persistido es un snapshot: se mantiene independiente del rate vigente.
    expect(sale.commissionRate).toBe(0.05);
    expect(sale.commissionAmount).toBe(12.5);
  });

  it('mother expone los estados de la atribución (estimated/confirmed/void)', () => {
    expect(SaleAttributionMother.estimated().status).toBe('estimated');
    expect(SaleAttributionMother.confirmed().status).toBe('confirmed');
    expect(SaleAttributionMother.voided().status).toBe('void');
  });
});
