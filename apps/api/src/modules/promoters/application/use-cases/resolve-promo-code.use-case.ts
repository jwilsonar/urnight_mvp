import { Inject, Injectable } from '@nestjs/common';
import type { RedemptionCodeStatus, ResolveRedemptionCodeResponse } from '@urnight/contracts';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type ResolvedRedemptionCodeView,
} from '../../domain/ports/promo-code.repository';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Caso de uso (público): resuelve un código para la landing `/p/<code>` y la
 * precarga del checkout. Devuelve validez, estado, promotor, evento, tipo de
 * entrada y ahorro. `isFree` = descuento 100% (única vía habilitada en el MVP).
 */
@Injectable()
export class ResolveRedemptionCodeUseCase {
  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  async execute(code: string): Promise<ResolveRedemptionCodeResponse> {
    const v = await this.promoCodes.resolveView(code);
    if (!v) {
      return {
        valid: false,
        code: code.toUpperCase(),
        status: null,
        reason: 'Código no encontrado',
        promoterName: null,
        discountType: null,
        discountValue: null,
        isFree: false,
        savings: 0,
        event: null,
        ticketType: null,
      };
    }

    const { status, valid, reason } = this.evaluate(v);
    const isFree = v.discountType === 'percentage' && v.discountValue === 100;
    const price = v.ticketType?.price ?? 0;
    const savings =
      v.discountType === 'percentage'
        ? round2(Math.min((price * v.discountValue) / 100, price))
        : round2(Math.min(v.discountValue, price));

    return {
      valid,
      code: v.code,
      status,
      reason,
      promoterName: v.promoterName,
      discountType: v.discountType,
      discountValue: v.discountValue,
      isFree,
      savings,
      event: v.event
        ? {
            id: v.event.id,
            slug: v.event.slug,
            name: v.event.name,
            startsAt: v.event.startsAt.toISOString(),
            flyerUrl: v.event.flyerUrl,
          }
        : null,
      ticketType: v.ticketType,
    };
  }

  private evaluate(v: ResolvedRedemptionCodeView): {
    status: RedemptionCodeStatus;
    valid: boolean;
    reason: string | null;
  } {
    const now = new Date();
    if (!v.isActive) return { status: 'revoked', valid: false, reason: 'Código inactivo' };
    if (v.validUntil && now > v.validUntil) {
      return { status: 'expired', valid: false, reason: 'Código expirado' };
    }
    if (v.usageQuota !== null && v.usedCount >= v.usageQuota) {
      return { status: 'redeemed', valid: false, reason: 'Código ya canjeado' };
    }
    return { status: 'active', valid: true, reason: null };
  }
}
