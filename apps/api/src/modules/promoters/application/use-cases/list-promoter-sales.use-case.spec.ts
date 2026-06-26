import { describe, expect, it } from 'vitest';
import {
  InMemoryPromoterRepository,
  InMemorySaleAttributionRepository,
} from '../../../../shared/testing/in-memory/promoters';
import {
  PromoterBuilder,
  SaleAttributionBuilder,
} from '../../../../shared/testing/builders/promoters';
import { PromoterNotFoundError } from '../../domain/errors/promoters.errors';
import { ListPromoterSalesUseCase } from './list-promoter-sales.use-case';

function build() {
  const promoters = new InMemoryPromoterRepository();
  const attributions = new InMemorySaleAttributionRepository();
  const useCase = new ListPromoterSalesUseCase(promoters, attributions);
  return { promoters, attributions, useCase };
}

describe('ListPromoterSalesUseCase', () => {
  it('devuelve las atribuciones del promotor y suma la comisión total (redondeada)', async () => {
    const { promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').build());
    attributions.seed(
      new SaleAttributionBuilder().withPromoterId('p1').withCommissionAmount(10.1).build(),
    );
    attributions.seed(
      new SaleAttributionBuilder().withPromoterId('p1').withCommissionAmount(5.05).build(),
    );

    const result = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'u1',
      isSuperAdmin: true,
    });

    expect(result.promoterId).toBe('p1');
    expect(result.attributions).toHaveLength(2);
    expect(result.totalCommission).toBe(15.15); // 10.1 + 5.05
  });

  it('solo cuenta las atribuciones del promotor consultado (aislamiento)', async () => {
    const { promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').build());
    attributions.seed(
      new SaleAttributionBuilder().withPromoterId('p1').withCommissionAmount(8).build(),
    );
    attributions.seed(
      new SaleAttributionBuilder().withPromoterId('p2').withCommissionAmount(99).build(),
    );

    const result = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'u1',
      isSuperAdmin: true,
    });

    expect(result.attributions).toHaveLength(1);
    expect(result.totalCommission).toBe(8);
  });

  it('promotor sin ventas → lista vacía y comisión total cero', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').build());

    const result = await useCase.execute({
      promoterId: 'p1',
      actorUserId: 'u1',
      isSuperAdmin: true,
    });

    expect(result.attributions).toHaveLength(0);
    expect(result.totalCommission).toBe(0);
  });

  it('promotor inexistente → PromoterNotFoundError tipado', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ promoterId: 'ghost', actorUserId: 'u1', isSuperAdmin: true }),
    ).rejects.toBeInstanceOf(PromoterNotFoundError);
  });
});
