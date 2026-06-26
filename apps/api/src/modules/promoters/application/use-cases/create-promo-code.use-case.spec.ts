import { describe, expect, it } from 'vitest';
import type { CreatePromoCodeDto } from '@urnight/contracts';
import {
  InMemoryPromoCodeRepository,
  InMemoryPromoterRepository,
} from '../../../../shared/testing/in-memory/promoters';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import { FakeResourceTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { PromoCodeCodeTakenError } from '../../domain/errors/promoters.errors';
import { CreatePromoCodeUseCase } from './create-promo-code.use-case';

function build() {
  const promoCodes = new InMemoryPromoCodeRepository();
  const promoters = new InMemoryPromoterRepository();
  const useCase = new CreatePromoCodeUseCase(promoCodes, promoters, new FakeResourceTenant());
  return { promoCodes, useCase };
}

const dto: CreatePromoCodeDto = {
  code: 'SUMMER20',
  discountType: 'percentage',
  discountValue: 20,
  usageQuota: 100,
  validFrom: '2026-06-01T00:00:00.000Z',
  validUntil: '2026-08-31T23:59:59.000Z',
  scope: 'global',
};

describe('CreatePromoCodeUseCase', () => {
  it('crea un código activo y lo persiste con vigencia parseada a Date', async () => {
    const { promoCodes, useCase } = build();

    const result = await useCase.execute({ dto, scope: SUPER_ADMIN_SCOPE });

    expect(result.code).toBe('SUMMER20');
    expect(result.discountType).toBe('percentage');
    expect(result.discountValue).toBe(20);
    expect(result.usageQuota).toBe(100);
    expect(result.usedCount).toBe(0);
    expect(result.isActive).toBe(true);
    expect(promoCodes.size).toBe(1);
    expect(await promoCodes.findByCode('SUMMER20')).not.toBeNull();
  });

  it('aplica usageQuota null cuando el dto no la trae (uso ilimitado)', async () => {
    const { useCase } = build();
    const { usageQuota: _omit, ...rest } = dto;
    const result = await useCase.execute({ dto: rest as CreatePromoCodeDto, scope: SUPER_ADMIN_SCOPE });
    expect(result.usageQuota).toBeNull();
  });

  it('código duplicado → PromoCodeCodeTakenError tipado', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('SUMMER20').build());

    await expect(
      useCase.execute({ dto, scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(PromoCodeCodeTakenError);
    expect(promoCodes.size).toBe(1); // no se duplica
  });
});
