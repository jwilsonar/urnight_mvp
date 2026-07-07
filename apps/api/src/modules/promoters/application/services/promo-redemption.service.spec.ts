import { describe, expect, it } from 'vitest';
import { InMemoryPromoCodeRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import {
  PromoCodeAlreadyRedeemedError,
  PromoCodeInvalidError,
  PromoCodeNotFoundError,
} from '../../domain/errors/promoters.errors';
import { PromoRedemptionService } from './promo-redemption.service';

function build() {
  const promoCodes = new InMemoryPromoCodeRepository();
  const service = new PromoRedemptionService(promoCodes);
  return { promoCodes, service };
}

const ctx = (over: Partial<Parameters<PromoRedemptionService['preview']>[0]> = {}) => ({
  code: 'WELCOME10',
  userId: 'u1',
  eventId: 'ev1',
  subtotal: 100,
  ...over,
});

describe('PromoRedemptionService', () => {
  it('preview: código válido devuelve descuento calculado', async () => {
    const { promoCodes, service } = build();
    promoCodes.seed(new PromoCodeBuilder().withId('pc1').withCode('WELCOME10').asPercentage(10).build());

    const result = await service.preview(ctx());

    expect(result.promoCodeId).toBe('pc1');
    expect(result.discount).toBe(10); // 10% de 100
  });

  it('preview: código inexistente → PromoCodeNotFoundError', async () => {
    const { service } = build();
    await expect(service.preview(ctx())).rejects.toBeInstanceOf(PromoCodeNotFoundError);
  });

  it('preview: cupo agotado (used>=quota) → PromoCodeInvalidError (cupo)', async () => {
    const { promoCodes, service } = build();
    promoCodes.seed(
      new PromoCodeBuilder().withId('pc1').withCode('WELCOME10').withUsageQuota(1).withUsedCount(1).build(),
    );

    await expect(service.preview(ctx())).rejects.toBeInstanceOf(PromoCodeInvalidError);
  });

  it('límite por usuario: un mismo usuario no canjea dos veces el mismo código', async () => {
    const { promoCodes, service } = build();
    promoCodes.seed(new PromoCodeBuilder().withId('pc1').withCode('WELCOME10').asPercentage(10).build());
    await promoCodes.recordRedemption({
      id: 'r1',
      promoCodeId: 'pc1',
      orderId: 'o1',
      userId: 'u1',
      discountApplied: 10,
      redeemedAt: new Date(),
    });

    await expect(service.preview(ctx({ userId: 'u1' }))).rejects.toBeInstanceOf(
      PromoCodeAlreadyRedeemedError,
    );
    // Otro usuario sí puede canjearlo.
    await expect(service.preview(ctx({ userId: 'u2' }))).resolves.toMatchObject({ promoCodeId: 'pc1' });
  });

  it('redeem: registra el canje del usuario', async () => {
    const { promoCodes, service } = build();
    promoCodes.seed(new PromoCodeBuilder().withId('pc1').withCode('WELCOME10').asPercentage(10).build());

    await service.redeem({ promoCodeId: 'pc1', orderId: 'o1', userId: 'u1', discount: 10 });

    expect(await promoCodes.listRedemptionsByUser('u1')).toHaveLength(1);
  });
});
