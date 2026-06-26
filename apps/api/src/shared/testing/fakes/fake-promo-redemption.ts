import {
  PromoRedemptionPort,
  type PromoApplication,
  type PromoApplyContext,
} from '../../ports/promo-redemption.port';

/** PromoRedemptionPort de prueba: descuento configurable, redeem sin efectos. */
export class FakePromoRedemption extends PromoRedemptionPort {
  constructor(private readonly discount = 0) {
    super();
  }

  async preview(_ctx: PromoApplyContext): Promise<PromoApplication> {
    return { promoCodeId: 'promo-test', discount: this.discount };
  }

  async redeem(): Promise<void> {}
}
