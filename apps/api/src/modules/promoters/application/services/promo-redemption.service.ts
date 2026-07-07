import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  PromoApplyContext,
  PromoApplication,
  PromoRedemptionPort,
} from '../../../../shared/ports/promo-redemption.port';
import {
  PromoCodeAlreadyRedeemedError,
  PromoCodeInvalidError,
  PromoCodeNotFoundError,
} from '../../domain/errors/promoters.errors';
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
    // Límite por usuario (M1, fail-fast antes de cobrar): un mismo usuario no
    // canjea dos veces el mismo código. La barrera dura es el UNIQUE
    // (promo_code_id, user_id) del esquema, aplicada en `redeem` dentro de la Tx.
    const previous = await this.promoCodes.listRedemptionsByUser(ctx.userId);
    if (previous.some((r) => r.promoCodeId === promo.id)) {
      throw new PromoCodeAlreadyRedeemedError();
    }
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
