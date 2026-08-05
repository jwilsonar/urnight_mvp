import { describe, expect, it } from "vitest";
import type { DomainEvent } from "../../../../shared/event-bus/domain-event";
import { EventBus } from "../../../../shared/event-bus/event-bus";
import {
  InMemoryPromoCodeRepository,
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
  InMemorySaleAttributionRepository,
} from "../../../../shared/testing/in-memory/promoters";
import { FakePromoterCascadePolicyRepository } from "../../testing/fake-promoter-cascade-policy.repository";
import { InMemoryPlatformSettingRepository } from "../../../../shared/testing/in-memory/ops";
import {
  PromoterBuilder,
  ReferralLinkBuilder,
} from "../../../../shared/testing/builders/promoters";
import { PlatformSettingBuilder } from "../../../../shared/testing/builders/ops";
import { PromoterCommissionPolicy } from "../config/commission";
import { PromoterCascadeCommissionPolicy } from "../config/cascade-commission";
import { AttributeSaleUseCase } from "../use-cases/attribute-sale.use-case";
import { OrderPaidSubscriber } from "./order-paid.subscriber";

function build() {
  const links = new InMemoryReferralLinkRepository();
  const promoCodes = new InMemoryPromoCodeRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const attributions = new InMemorySaleAttributionRepository();
  const settings = new InMemoryPlatformSettingRepository().seed(
    new PlatformSettingBuilder()
      .withKey("default_commission_rate")
      .withTypedValue("0.05", "number")
      .build(),
  );
  const attribute = new AttributeSaleUseCase(
    links,
    promoCodes,
    promoters,
    attributions,
    new PromoterCommissionPolicy(settings),
    new PromoterCascadeCommissionPolicy(
      new FakePromoterCascadePolicyRepository(),
    ),
  );
  const bus = new EventBus();
  const subscriber = new OrderPaidSubscriber(bus, attribute);
  subscriber.onModuleInit();
  return { bus, links, promoCodes, promoters, attributions };
}

/** Construye un evento checkout.order_paid con el payload mínimo que lee el suscriptor. */
function orderPaid(payload: {
  orderId: string;
  total: number;
  referralCode: string | null;
}): DomainEvent {
  return { name: "checkout.order_paid", occurredAt: new Date(), payload };
}

describe("OrderPaidSubscriber", () => {
  it("reacciona a checkout.order_paid y atribuye la venta al promotor del referral", async () => {
    const { bus, links, promoters, attributions } = build();
    promoters.seed(new PromoterBuilder().withId("p1").build());
    links.seed(
      new ReferralLinkBuilder().withPromoterId("p1").withCode("REF1").build(),
    );

    await bus.publish(
      orderPaid({ orderId: "o1", total: 200, referralCode: "REF1" }),
    );

    expect(attributions.size).toBe(1);
    expect(attributions.all[0]?.orderId).toBe("o1");
    expect(attributions.all[0]?.commissionAmount).toBe(10); // 200 * 0.05
  });

  it("sin referral ni promo canjeado no crea atribución", async () => {
    const { bus, attributions } = build();

    await bus.publish(
      orderPaid({ orderId: "o1", total: 200, referralCode: null }),
    );

    expect(attributions.size).toBe(0);
  });

  it("best-effort: si la atribución falla, no propaga el error (no rompe el pago)", async () => {
    const { bus, attributions } = build();
    // referralCode desconocido → AttributeSaleUseCase no encuentra link y no atribuye.
    await expect(
      bus.publish(
        orderPaid({ orderId: "o1", total: 200, referralCode: "GHOST" }),
      ),
    ).resolves.toBeUndefined();
    expect(attributions.size).toBe(0);
  });

  it("sin referralCode atribuye por el promo code canjeado y persiste comisión", async () => {
    const { bus, promoCodes, promoters, attributions } = build();
    promoters.seed(new PromoterBuilder().withId("p1").build());
    await promoCodes.createGenerated({
      id: "promo-1",
      code: "ANA1",
      discountType: "percentage",
      discountValue: 100,
      eventId: "event-1",
      ticketTypeId: "ticket-type-1",
      promoterId: "p1",
      promoterEventId: "promoter-event-1",
      createdBy: "p1",
    });
    await promoCodes.recordRedemption({
      id: "redemption-1",
      promoCodeId: "promo-1",
      orderId: "o1",
      userId: "buyer-1",
      discountApplied: 200,
      redeemedAt: new Date(),
    });

    await bus.publish(
      orderPaid({ orderId: "o1", total: 200, referralCode: null }),
    );

    expect(attributions.all[0]?.referralLinkId).toBeNull();
    expect(attributions.all[0]?.commissionAmount).toBe(10);
  });
});
