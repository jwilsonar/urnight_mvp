import { Inject, Injectable } from '@nestjs/common';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type PromoRedemptionRecord,
} from '../../domain/ports/promo-code.repository';

/** Caso de uso: canjes de promo del usuario autenticado (#13). */
@Injectable()
export class ListMyRedemptionsUseCase {
  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  execute(input: { userId: string }): Promise<PromoRedemptionRecord[]> {
    return this.promoCodes.listRedemptionsByUser(input.userId);
  }
}
