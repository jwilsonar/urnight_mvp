import { Inject, Injectable } from '@nestjs/common';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type PromoRedemptionRecord,
} from '../../domain/ports/promo-code.repository';

/** Caso de uso (admin): canjes de un código promocional (#13). */
@Injectable()
export class ListPromoCodeRedemptionsUseCase {
  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  execute(input: { promoCodeId: string }): Promise<PromoRedemptionRecord[]> {
    return this.promoCodes.listRedemptionsByCode(input.promoCodeId);
  }
}
