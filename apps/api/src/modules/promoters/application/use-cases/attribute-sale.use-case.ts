import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import { PROMOTER_COMMISSION_RATE } from '../config/commission';
import { SaleAttribution } from '../../domain/entities/sale-attribution.entity';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import {
  REFERRAL_LINK_REPOSITORY,
  type ReferralLinkRepository,
} from '../../domain/ports/referral-link.repository';
import {
  SALE_ATTRIBUTION_REPOSITORY,
  type SaleAttributionRepository,
} from '../../domain/ports/sale-attribution.repository';

/**
 * Caso de uso: atribuir una venta a un promotor a partir de un `referralCode`
 * (gatillado por OrderPaid). Best-effort: no rompe el pago.
 *
 * NOTA (ADR 0003): NO hay ventana temporal de 7 días (§4.3 quedó superado). La
 * atribución de comisiones del modelo vivo ocurre por canje de promo/redemption
 * codes (`promo_code_redemption` → `promo_code.promoter_id`). Este gatillo por
 * `referralCode` está inerte hasta que un cliente informe ese campo; se conserva
 * (lo cubre el e2e del módulo) a la espera del re-cableado descrito en el ADR.
 */
@Injectable()
export class AttributeSaleUseCase {
  private readonly log = createLogger(AttributeSaleUseCase.name);

  constructor(
    @Inject(REFERRAL_LINK_REPOSITORY) private readonly links: ReferralLinkRepository,
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(SALE_ATTRIBUTION_REPOSITORY)
    private readonly attributions: SaleAttributionRepository,
  ) {}

  async execute(input: { orderId: string; referralCode: string; amount: number }): Promise<void> {
    this.log.debug({ orderId: input.orderId, referralCode: input.referralCode }, 'promoters.sale.attribution_started');
    if (await this.attributions.existsForOrder(input.orderId)) return;

    const link = await this.links.findByCode(input.referralCode);
    if (!link || !link.isActive) return;

    const promoter = await this.promoters.findById(link.promoterId);
    if (!promoter || !promoter.isActive()) return;

    const attribution = SaleAttribution.estimate({
      id: randomUUID(),
      orderId: input.orderId,
      promoterId: promoter.id,
      referralLinkId: link.id,
      commissionRate: PROMOTER_COMMISSION_RATE,
      amount: input.amount,
    });
    await this.attributions.create(attribution);
    this.log.info(
      { orderId: input.orderId, promoterId: promoter.id, referralLinkId: link.id, commissionRate: PROMOTER_COMMISSION_RATE },
      'promoters.sale.attributed',
    );
  }
}
