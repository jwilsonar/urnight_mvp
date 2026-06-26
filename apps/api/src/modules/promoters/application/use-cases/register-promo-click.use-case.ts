import { Inject, Injectable } from '@nestjs/common';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from '../../domain/ports/promo-code.repository';

/** Caso de uso (público): registra un clic del enlace corto `/p/<code>`. */
@Injectable()
export class RegisterRedemptionClickUseCase {
  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  async execute(code: string): Promise<void> {
    await this.promoCodes.incrementClicks(code);
  }
}
