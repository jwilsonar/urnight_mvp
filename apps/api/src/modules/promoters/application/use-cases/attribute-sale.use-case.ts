import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { createLogger } from "../../../../shared/logging/logger";
import { PromoterCommissionPolicy } from "../config/commission";
import { PromoterCascadeCommissionPolicy } from "../config/cascade-commission";
import { SaleAttribution } from "../../domain/entities/sale-attribution.entity";
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from "../../domain/ports/promo-code.repository";
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from "../../domain/ports/promoter.repository";
import {
  REFERRAL_LINK_REPOSITORY,
  type ReferralLinkRepository,
} from "../../domain/ports/referral-link.repository";
import {
  SALE_ATTRIBUTION_REPOSITORY,
  type SaleAttributionRepository,
} from "../../domain/ports/sale-attribution.repository";

/**
 * Atribuye una orden pagada por referral activo o por el promo_code canjeado.
 * El rate y el monto quedan persistidos como snapshot en sale_attribution:
 * posteriores cambios de PLATFORM_SETTING no alteran ventas históricas.
 * Best-effort: un fallo de atribución nunca revierte el pago.
 */
@Injectable()
export class AttributeSaleUseCase {
  private readonly log = createLogger(AttributeSaleUseCase.name);

  constructor(
    @Inject(REFERRAL_LINK_REPOSITORY)
    private readonly links: ReferralLinkRepository,
    @Inject(PROMO_CODE_REPOSITORY)
    private readonly promoCodes: PromoCodeRepository,
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(SALE_ATTRIBUTION_REPOSITORY)
    private readonly attributions: SaleAttributionRepository,
    private readonly commissionPolicy: PromoterCommissionPolicy,
    private readonly cascadePolicy: PromoterCascadeCommissionPolicy,
  ) {}

  async execute(input: {
    orderId: string;
    referralCode?: string | null;
    amount: number;
  }): Promise<void> {
    this.log.debug(
      { orderId: input.orderId, referralCode: input.referralCode },
      "promoters.sale.attribution_started",
    );
    if (await this.attributions.existsForOrder(input.orderId)) return;

    const link = input.referralCode
      ? await this.links.findByCode(input.referralCode)
      : null;
    let promoterId = link?.isActive ? link.promoterId : null;
    let referralLinkId = link?.isActive ? link.id : null;
    if (!promoterId) {
      const promo = await this.promoCodes.findAttributionByOrder(input.orderId);
      promoterId = promo?.promoterId ?? null;
      referralLinkId = null;
    }
    if (!promoterId) return;

    const promoter = await this.promoters.findById(promoterId);
    if (!promoter || !promoter.isActive()) return;
    const commissionRate = await this.commissionPolicy.currentRate();
    const cascadePolicy = await this.cascadePolicy.forOrder(input.orderId);
    const head =
      cascadePolicy.cascadeEnabled && promoter.parentPromoterId
        ? await this.promoters.findById(promoter.parentPromoterId)
        : null;

    const attribution = SaleAttribution.estimate({
      id: randomUUID(),
      orderId: input.orderId,
      promoterId: promoter.id,
      referralLinkId,
      commissionRate,
      amount: input.amount,
      headCommission: head?.isActive()
        ? {
            promoterId: head.id,
            rate: cascadePolicy.cascadePercentage / 100,
          }
        : null,
    });
    await this.attributions.create(attribution);
    this.log.info(
      {
        orderId: input.orderId,
        promoterId: promoter.id,
        referralLinkId,
        commissionRate,
      },
      "promoters.sale.attributed",
    );
  }
}
