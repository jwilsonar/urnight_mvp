import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  PromoApplyContext,
  PromoApplication,
  PromoRedemptionPort,
} from '../../../../shared/ports/promo-redemption.port';
import { PromoCodeInvalidError, PromoCodeNotFoundError } from '../../domain/errors/promoters.errors';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from '../../domain/ports/promo-code.repository';

/**
 * Adapter del puerto PromoRedemptionPort (lo implementa Promoters; lo consume
 * Ticketing). Reusa el aggregate PromoCode (isValid/computeDiscount) y persiste
 * el canje + incremento de uso dentro de la Tx del checkout.
 */
@Injectable()
export class PromoRedemptionService extends PromoRedemptionPort {
  constructor(
    @Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository,
  ) {
    super();
  }

  async preview(ctx: PromoApplyContext): Promise<PromoApplication> {
    const promo = await this.promoCodes.findByCode(ctx.code);
    if (!promo) throw new PromoCodeNotFoundError();
    const promoCtx = {
      subtotal: ctx.subtotal,
      eventId: ctx.eventId,
      localId: ctx.localId,
      items: ctx.items,
    };
    const check = promo.isValid(promoCtx);
    if (!check.valid) throw new PromoCodeInvalidError(check.reason ?? 'Código inválido');
    return { promoCodeId: promo.id, discount: promo.computeDiscount(promoCtx) };
  }

  async redeem(
    input: { promoCodeId: string; orderId: string; userId: string; discount: number },
    tx?: unknown,
  ): Promise<void> {
    await this.promoCodes.recordRedemption(
      {
        id: randomUUID(),
        promoCodeId: input.promoCodeId,
        orderId: input.orderId,
        userId: input.userId,
        discountApplied: input.discount,
        redeemedAt: new Date(),
      },
      tx,
    );
    await this.promoCodes.incrementUsedCount(input.promoCodeId, tx);
  }
}
