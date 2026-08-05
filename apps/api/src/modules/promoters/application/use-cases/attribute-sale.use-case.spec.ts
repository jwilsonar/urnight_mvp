import { describe, expect, it } from "vitest";
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
  SaleAttributionBuilder,
} from "../../../../shared/testing/builders/promoters";
import { PlatformSettingBuilder } from "../../../../shared/testing/builders/ops";
import { PromoterCommissionPolicy } from "../config/commission";
import { PromoterCascadeCommissionPolicy } from "../config/cascade-commission";
import { AttributeSaleUseCase } from "./attribute-sale.use-case";

const PROMOTER_COMMISSION_RATE = 0.05;

function build() {
  const links = new InMemoryReferralLinkRepository();
  const promoCodes = new InMemoryPromoCodeRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const attributions = new InMemorySaleAttributionRepository();
  const cascadePolicies = new FakePromoterCascadePolicyRepository();
  const settings = new InMemoryPlatformSettingRepository().seed(
    new PlatformSettingBuilder()
      .withKey("default_commission_rate")
      .withTypedValue("0.05", "number")
      .build(),
  );
  const useCase = new AttributeSaleUseCase(
    links,
    promoCodes,
    promoters,
    attributions,
    new PromoterCommissionPolicy(settings),
    new PromoterCascadeCommissionPolicy(cascadePolicies),
  );
  return {
    links,
    promoCodes,
    promoters,
    attributions,
    cascadePolicies,
    useCase,
  };
}

/** Siembra un promotor activo con un link activo de código `code`. */
function seedActivePromoter(
  links: InMemoryReferralLinkRepository,
  promoters: InMemoryPromoterRepository,
  code: string,
): void {
  promoters.seed(new PromoterBuilder().withId("p1").build());
  links.seed(
    new ReferralLinkBuilder()
      .withId("rl1")
      .withPromoterId("p1")
      .withCode(code)
      .build(),
  );
}

describe("AttributeSaleUseCase", () => {
  it("atribuye la venta y toma snapshot de la comisión (rate por defecto 5%)", async () => {
    const { links, promoters, attributions, useCase } = build();
    seedActivePromoter(links, promoters, "REF1");

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.size).toBe(1);
    const sale = attributions.all[0];
    expect(sale?.orderId).toBe("o1");
    expect(sale?.promoterId).toBe("p1");
    expect(sale?.referralLinkId).toBe("rl1");
    expect(sale?.commissionRate).toBe(PROMOTER_COMMISSION_RATE);
    expect(sale?.commissionAmount).toBe(10); // 200 * 0.05
    expect(sale?.status).toBe("estimated");
    expect(sale?.attributedAt).toBeInstanceOf(Date);
  });

  it("persiste el snapshot cuando la orden pagada fue canjeada con promo code", async () => {
    const { promoCodes, promoters, attributions, useCase } = build();
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

    await useCase.execute({
      orderId: "o1",
      referralCode: null,
      amount: 200,
    });

    expect(attributions.all[0]?.promoterId).toBe("p1");
    expect(attributions.all[0]?.referralLinkId).toBeNull();
    expect(attributions.all[0]?.commissionRate).toBe(0.05);
    expect(attributions.all[0]?.commissionAmount).toBe(10);
  });

  it("es idempotente: si ya existe atribución para la orden, no crea otra", async () => {
    const { links, promoters, attributions, useCase } = build();
    seedActivePromoter(links, promoters, "REF1");
    attributions.seed(new SaleAttributionBuilder().withOrderId("o1").build());

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.size).toBe(1); // sin duplicar
  });

  it("código de referido inexistente → no atribuye (best-effort)", async () => {
    const { attributions, useCase } = build();
    await useCase.execute({
      orderId: "o1",
      referralCode: "GHOST",
      amount: 200,
    });
    expect(attributions.size).toBe(0);
  });

  it("link inactivo → no atribuye", async () => {
    const { links, promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId("p1").build());
    links.seed(
      new ReferralLinkBuilder()
        .withPromoterId("p1")
        .withCode("REF1")
        .asInactive()
        .build(),
    );

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.size).toBe(0);
  });

  it("promotor inactivo → no atribuye", async () => {
    const { links, promoters, attributions, useCase } = build();
    promoters.seed(new PromoterBuilder().withId("p1").asInactive().build());
    links.seed(
      new ReferralLinkBuilder().withPromoterId("p1").withCode("REF1").build(),
    );

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.size).toBe(0);
  });

  it("promotor del link inexistente → no atribuye", async () => {
    const { links, attributions, useCase } = build();
    // Link huérfano: apunta a un promotor que no existe en el repo.
    links.seed(
      new ReferralLinkBuilder()
        .withPromoterId("ghost")
        .withCode("REF1")
        .build(),
    );

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.size).toBe(0);
  });

  it("con la cascada apagada conserva exactamente la comision previa del vendedor", async () => {
    const { links, promoters, attributions, cascadePolicies, useCase } =
      build();
    promoters.seed(new PromoterBuilder().withId("head").build());
    const seller = new PromoterBuilder().withId("p1").build();
    seller.assignParent("head");
    promoters.seed(seller);
    links.seed(
      new ReferralLinkBuilder().withPromoterId("p1").withCode("REF1").build(),
    );
    cascadePolicies.seedForOrder("o1", {
      localId: "local-1",
      cascadeEnabled: false,
      cascadePercentage: 10,
    });

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.all[0]?.commissionAmount).toBe(10);
    expect(attributions.all[0]?.headPromoterId).toBeNull();
    expect(attributions.all[0]?.headCommissionAmount).toBeNull();
  });

  it("con cascada al 10 por ciento agrega la parte del cabeza sin reducir la del vendedor", async () => {
    const { links, promoters, attributions, cascadePolicies, useCase } =
      build();
    promoters.seed(new PromoterBuilder().withId("head").build());
    const seller = new PromoterBuilder().withId("p1").build();
    seller.assignParent("head");
    promoters.seed(seller);
    links.seed(
      new ReferralLinkBuilder().withPromoterId("p1").withCode("REF1").build(),
    );
    cascadePolicies.seedForOrder("o1", {
      localId: "local-1",
      cascadeEnabled: true,
      cascadePercentage: 10,
    });

    await useCase.execute({ orderId: "o1", referralCode: "REF1", amount: 200 });

    expect(attributions.all[0]?.commissionAmount).toBe(10);
    expect(attributions.all[0]?.headPromoterId).toBe("head");
    expect(attributions.all[0]?.headCommissionRate).toBe(0.1);
    expect(attributions.all[0]?.headCommissionAmount).toBe(20);
  });
});
