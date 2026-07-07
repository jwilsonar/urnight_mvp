import { describe, expect, it } from 'vitest';
import { InMemoryPromoCodeRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import { ResolveRedemptionCodeUseCase } from './resolve-promo-code.use-case';

function build() {
  const promoCodes = new InMemoryPromoCodeRepository();
  const useCase = new ResolveRedemptionCodeUseCase(promoCodes);
  return { promoCodes, useCase };
}

describe('ResolveRedemptionCodeUseCase', () => {
  it('código inexistente → valid=false, status null, motivo explícito', async () => {
    const { useCase } = build();

    const res = await useCase.execute('NOEXISTE');

    expect(res.valid).toBe(false);
    expect(res.status).toBeNull();
    expect(res.reason).toBe('Código no encontrado');
    expect(res.code).toBe('NOEXISTE');
  });

  it('código activo → valid=true, status active', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('FREE100').asPercentage(100).build());

    const res = await useCase.execute('free100');

    expect(res.valid).toBe(true);
    expect(res.status).toBe('active');
    expect(res.isFree).toBe(true);
  });

  it('código inactivo → status revoked, valid=false', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('OFF').asInactive().build());

    const res = await useCase.execute('OFF');

    expect(res.status).toBe('revoked');
    expect(res.valid).toBe(false);
  });

  it('código con cupo agotado → status redeemed, valid=false', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(
      new PromoCodeBuilder().withCode('USED').withUsageQuota(1).withUsedCount(1).build(),
    );

    const res = await useCase.execute('USED');

    expect(res.status).toBe('redeemed');
    expect(res.valid).toBe(false);
  });
});
