import { Inject, Injectable } from '@nestjs/common';
import type { Promoter } from '../../domain/entities/promoter.entity';
import type { ReferralLink } from '../../domain/entities/referral-link.entity';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

export interface MyPromoterResult {
  promoter: Promoter;
  link: ReferralLink | null;
}

/**
 * Resuelve el promotor ACTIVO ligado al usuario de sesión (+ su link de referido).
 * Devuelve null si la persona aún no es promotor → el panel muestra el formulario
 * de postulación; si existe, muestra el panel real (arregla el bug del dashboard).
 */
@Injectable()
export class GetMyPromoterUseCase {
  constructor(@Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository) {}

  async execute(userId: string): Promise<MyPromoterResult | null> {
    const promoter = await this.promoters.findActiveByUserId(userId);
    if (!promoter) return null;
    const link = await this.promoters.getLink(promoter.id);
    return { promoter, link };
  }
}
