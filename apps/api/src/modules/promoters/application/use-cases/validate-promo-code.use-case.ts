import { Inject, Injectable } from '@nestjs/common';
import type { PromoValidationResponse, ValidatePromoCodeDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from '../../domain/ports/promo-code.repository';

/** Caso de uso (preview): validar un código y calcular el descuento. */
@Injectable()
export class ValidatePromoCodeUseCase {
  private readonly log = createLogger(ValidatePromoCodeUseCase.name);

  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  async execute(dto: ValidatePromoCodeDto): Promise<PromoValidationResponse> {
    this.log.debug({ referralCode: dto.code }, 'promoters.promo_code.validate_started');
    const promo = await this.promoCodes.findByCode(dto.code);
    if (!promo) {
      return { valid: false, discount: 0, discountType: null, reason: 'Código no encontrado' };
    }
    const check = promo.isValid({ subtotal: dto.subtotal, eventId: dto.eventId, localId: dto.localId });
    if (!check.valid) {
      return { valid: false, discount: 0, discountType: promo.discountType, reason: check.reason };
    }
    this.log.info({ promoCodeId: promo.id }, 'promoters.promo_code.validated');
    return {
      valid: true,
      discount: promo.computeDiscount({
        subtotal: dto.subtotal,
        eventId: dto.eventId,
        localId: dto.localId,
      }),
      discountType: promo.discountType,
      reason: null,
    };
  }
}
