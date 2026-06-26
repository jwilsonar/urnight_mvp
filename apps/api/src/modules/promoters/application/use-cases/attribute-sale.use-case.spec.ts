import { describe, expect, it } from 'vitest';
import {
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
  InMemorySaleAttributionRepository,
} from '../../../../shared/testing/in-memory/promoters';
import {
  PromoterBuilder,
  ReferralLinkBuilder,
  SaleAttributionBuilder,
} from '../../../../shared/testing/builders/promoters';
import { AttributeSaleUseCase } from './attribute-sale.use-case';

const PROMOTER_COMMISSION_RATE = 0.05;

function build() {
  const links = new InMemoryReferralLinkRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const attributions = new InMemorySaleAttributionRepository();
  const useCase = new AttributeSaleUseCase(links, promoters, attributions);
  return { links, promoters, attributions, useCase };
}

/** Siembra un promotor activo con un link activo de código `code`. */
function seedActivePromoter(
  links: InMemoryReferralLinkRepository,
  promoters: InMemoryPromoterRepository,
  code: string,
): void {
  promoters.seed(new PromoterBuilder().withId('p1').build());
  links.seed(new ReferralLinkBuilder().withId('rl1').withPromoterId('p1').withCode(code).build());
}

describe('AttributeSaleUseCase', () => {
  it('atribuye la venta y toma snapshot de la comisión (rate por defecto 5%)', async () => {
    const { links, promoters, attributions, useCase } = build();
    seedActivePromoter(links, promoters, 'REF1');

    await useCase.execute({ orderId: 'o1', referralCode: 'REF1', amount: 200 });

    expect(attributions.size).toBe(1);
    const sale = attributions.all[0];
    expect(sale?.orderId).toBe('o1');
    expect(sale?.promoterId).toBe('p1');
    expect(sale?.referralLinkId).toBe('rl1');
    expect(sale?.commissionRate).toBe(PROMOTER_COMMISSION_RATE);
    expect(sale?.commissionAmount).toBe(10); // 200 * 0.05
    expect(sale?.status).toBe('estimated');
    expect(sale?.attributedAt).toBeInstanceOf(Date);
  });

  it('es idempotente: si ya existe atribución para la orden, no crea otra', async () => {
    const { links, promoters, attributions, useCase } = build();
    seedActivePromoter(links, promoters, 'REF1');
    attributions.seed(new SaleAttributionBuilder().withOrderId('o1').build());

    await useCase.execute({ orderId: 'o1', referralCode: 'REF1', amount: 200 });

    expect(attributions.size).toBe(1); // sin duplicar
  });

  it('código de referido inexistente → no atribuye (best-effort)', async () => {
    const { attributions, useCase } = build();
    await useCase.execute({ orderId: 'o1', referralCode: 'GHOST', amount: 200 });
    expect(attributions.size).toBe(0);
  });

  it('link inactivo → no atribuye', async () => {
    const { links, promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').build());
    links.seed(
      new ReferralLinkBuilder().withPromoterId('p1').withCode('REF1').asInactive().build(),
    );

    await useCase.execute({ orderId: 'o1', referralCode: 'REF1', amount: 200 });

    expect(attributions.size).toBe(0);
  });

  it('promotor inactivo → no atribuye', async () => {
    const { links, promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').asInactive().build());
    links.seed(new ReferralLinkBuilder().withPromoterId('p1').withCode('REF1').build());

    await useCase.execute({ orderId: 'o1', referralCode: 'REF1', amount: 200 });

    expect(attributions.size).toBe(0);
  });

  it('promotor del link inexistente → no atribuye', async () => {
    const { links, attributions, useCase } = build();
    // Link huérfano: apunta a un promotor que no existe en el repo.
    links.seed(new ReferralLinkBuilder().withPromoterId('ghost').withCode('REF1').build());

    await useCase.execute({ orderId: 'o1', referralCode: 'REF1', amount: 200 });

    expect(attributions.size).toBe(0);
  });
});
