import { describe, expect, it } from 'vitest';
import type { ValidatePromoCodeDto } from '@urnight/contracts';
import { InMemoryPromoCodeRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import { ValidatePromoCodeUseCase } from './validate-promo-code.use-case';

function build() {
  const promoCodes = new InMemoryPromoCodeRepository();
  const useCase = new ValidatePromoCodeUseCase(promoCodes);
  return { promoCodes, useCase };
}

describe('ValidatePromoCodeUseCase (preview)', () => {
  it('código válido (porcentaje sin vigencia) → calcula el descuento', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('VAL10').asPercentage(10).build());

    const dto: ValidatePromoCodeDto = { code: 'VAL10', subtotal: 200 };
    const result = await useCase.execute(dto);

    expect(result.valid).toBe(true);
    expect(result.discount).toBe(20); // 10% de 200
    expect(result.discountType).toBe('percentage');
    expect(result.reason).toBeNull();
  });

  it('código inexistente → valid false, descuento 0, razón "Código no encontrado"', async () => {
    const { useCase } = build();

    const result = await useCase.execute({ code: 'GHOST', subtotal: 100 });

    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.discountType).toBeNull();
    expect(result.reason).toBe('Código no encontrado');
  });

  it('código inactivo → valid false con razón del dominio y descuento 0', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('OFF').asInactive().build());

    const result = await useCase.execute({ code: 'OFF', subtotal: 100 });

    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.discountType).toBe('percentage'); // conserva el tipo del código
    expect(result.reason).toBe('Código inactivo');
  });

  it('código con cupo agotado → valid false con razón "Cupo agotado"', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(
      new PromoCodeBuilder().withCode('FULL').withUsageQuota(3).withUsedCount(3).build(),
    );

    const result = await useCase.execute({ code: 'FULL', subtotal: 100 });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Cupo agotado');
  });

  it('scope event que no coincide con el contexto → valid false', async () => {
    const { promoCodes, useCase } = build();
    promoCodes.seed(new PromoCodeBuilder().withCode('EVT').forEvent('e1').build());

    const result = await useCase.execute({ code: 'EVT', subtotal: 100, eventId: 'e2' });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No aplica a este evento');
  });
});
