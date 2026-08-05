import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  attendee,
  company,
  event,
  local,
  order,
  orderItem,
  promoCode,
  promoCodeRedemption,
  promoter,
  promoterEvent,
  promoterTicketAllocation,
  referralLink,
  saleAttribution,
  ticket,
  ticketType,
  type DbClient,
  user,
} from "@urnight/db";
import {
  createTestDb,
  ensureTestDbMigrated,
  truncateAll,
} from "../../../../shared/testing/integration/test-db";
import { calculatePromoterMetrics } from "../../application/use-cases/promoter-metrics.calculator";
import { DrizzlePromoterAnalyticsRepository } from "./drizzle-promoter-analytics.repository";

let client: DbClient;
let repo: DrizzlePromoterAnalyticsRepository;

beforeAll(async () => {
  await ensureTestDbMigrated();
  client = createTestDb();
  repo = new DrizzlePromoterAnalyticsRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

async function seedAnalytics(companyLabel: string) {
  const ids = {
    companyId: randomUUID(),
    localId: randomUUID(),
    eventId: randomUUID(),
    userId: randomUUID(),
    promoterId: randomUUID(),
    promoterEventId: randomUUID(),
    allocationId: randomUUID(),
    referralLinkId: randomUUID(),
    promoCodeId: randomUUID(),
    orderId: randomUUID(),
    orderItemId: randomUUID(),
    ticketTypeId: randomUUID(),
    buyerTicketId: randomUUID(),
    companionTicketId: randomUUID(),
  };
  const usedAt = new Date("2026-08-02T04:30:00.000Z");

  await client.db.insert(company).values({
    id: ids.companyId,
    legalName: `${companyLabel} SAC`,
    ruc: `20${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0")}`,
    commercialName: companyLabel,
  });
  await client.db.insert(local).values({
    id: ids.localId,
    companyId: ids.companyId,
    name: `Local ${companyLabel}`,
    slug: `local-${ids.localId}`,
  });
  await client.db.insert(event).values({
    id: ids.eventId,
    localId: ids.localId,
    name: `Evento ${companyLabel}`,
    slug: `evento-${ids.eventId}`,
    startsAt: new Date("2026-08-02T03:00:00.000Z"),
    status: "finished",
  });
  await client.db.insert(user).values({
    id: ids.userId,
    fullName: "Comprador Demo",
    email: `buyer-${ids.userId}@example.com`,
  });
  await client.db.insert(promoter).values({
    id: ids.promoterId,
    companyId: ids.companyId,
    name: `Promotor ${companyLabel}`,
    status: "active",
  });
  await client.db.insert(promoterEvent).values({
    id: ids.promoterEventId,
    promoterId: ids.promoterId,
    eventId: ids.eventId,
    status: "active",
  });
  await client.db.insert(referralLink).values({
    id: ids.referralLinkId,
    promoterId: ids.promoterId,
    code: ids.referralLinkId.slice(0, 12),
    url: `https://ravenue.pe/r/${ids.referralLinkId}`,
  });
  await client.db.insert(ticketType).values({
    id: ids.ticketTypeId,
    eventId: ids.eventId,
    name: "General",
    price: "50.00",
    stock: 10,
    sold: 2,
  });
  await client.db.insert(promoterTicketAllocation).values({
    id: ids.allocationId,
    promoterEventId: ids.promoterEventId,
    ticketTypeId: ids.ticketTypeId,
    allocatedStock: 40,
  });
  await client.db.insert(order).values({
    id: ids.orderId,
    orderCode: `ORD-${ids.orderId.slice(0, 8)}`,
    userId: ids.userId,
    eventId: ids.eventId,
    subtotal: "100.00",
    total: "100.00",
    status: "paid",
    paidAt: new Date("2026-07-20T12:00:00.000Z"),
  });
  await client.db.insert(orderItem).values({
    id: ids.orderItemId,
    orderId: ids.orderId,
    ticketTypeId: ids.ticketTypeId,
    quantity: 2,
    unitPrice: "50.00",
    lineTotal: "100.00",
  });
  await client.db.insert(ticket).values([
    {
      id: ids.buyerTicketId,
      orderItemId: ids.orderItemId,
      eventId: ids.eventId,
      ticketTypeId: ids.ticketTypeId,
      qrCode: `qr-${ids.buyerTicketId}`,
      status: "used",
      usedAt,
    },
    {
      id: ids.companionTicketId,
      orderItemId: ids.orderItemId,
      eventId: ids.eventId,
      ticketTypeId: ids.ticketTypeId,
      qrCode: `qr-${ids.companionTicketId}`,
      status: "valid",
    },
  ]);
  await client.db.insert(attendee).values([
    {
      id: randomUUID(),
      ticketId: ids.buyerTicketId,
      fullName: "Persona Compradora",
      documentType: "dni",
      documentNumber: ids.buyerTicketId.replaceAll("-", "").slice(0, 8),
      birthDate: "1990-01-01",
      isBuyer: true,
    },
    {
      id: randomUUID(),
      ticketId: ids.companionTicketId,
      fullName: "Persona Acompañante",
      documentType: "dni",
      documentNumber: ids.companionTicketId.replaceAll("-", "").slice(0, 8),
      birthDate: "1992-01-01",
      isBuyer: false,
    },
  ]);
  await client.db.insert(promoCode).values({
    id: ids.promoCodeId,
    code: ids.promoCodeId.replaceAll("-", "").slice(0, 12).toUpperCase(),
    discountType: "percentage",
    discountValue: "10.00",
    promoterId: ids.promoterId,
    eventId: ids.eventId,
    ticketTypeId: ids.ticketTypeId,
    promoterEventId: ids.promoterEventId,
    scope: "ticket_type",
  });
  await client.db.insert(promoCodeRedemption).values({
    id: randomUUID(),
    promoCodeId: ids.promoCodeId,
    orderId: ids.orderId,
    userId: ids.userId,
    discountApplied: "10.00",
  });
  await client.db.insert(saleAttribution).values({
    id: randomUUID(),
    orderId: ids.orderId,
    promoterId: ids.promoterId,
    referralLinkId: ids.referralLinkId,
    commissionRate: "0.1000",
    commissionAmount: "10.00",
    status: "confirmed",
  });

  return { ...ids, usedAt };
}

describe("DrizzlePromoterAnalyticsRepository (integration)", () => {
  it("lee asignaciones, fuentes de atribución y tickets reales aislados por compañía", async () => {
    const first = await seedAnalytics("Primera");
    await seedAnalytics("Segunda");

    const facts = await repo.listFacts({ companyId: first.companyId });

    expect(facts.assignments).toHaveLength(1);
    expect(facts.assignments[0]?.promoterId).toBe(first.promoterId);
    expect(facts.invitationLists).toEqual([
      expect.objectContaining({
        allocationId: first.allocationId,
        allocatedStock: 40,
        issuedCodes: [expect.objectContaining({ id: first.promoCodeId })],
      }),
    ]);
    expect(facts.attributions.map((fact) => fact.source).sort()).toEqual([
      "promo_code",
      "referral",
    ]);
    expect(facts.tickets).toHaveLength(2);
    expect(
      facts.tickets.find((fact) => fact.ticketId === first.buyerTicketId),
    ).toMatchObject({
      status: "used",
      usedAt: first.usedAt,
      isBuyer: true,
    });
  });

  it("calcula desde filas reales 40 emitidos, 10 canjes y 8 ingresos", async () => {
    const seeded = await seedAnalytics("Embudo");
    const extraCodes = Array.from({ length: 39 }, () => ({
      id: randomUUID(),
      code: randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase(),
    }));
    await client.db.insert(promoCode).values(
      extraCodes.map((code) => ({
        id: code.id,
        code: code.code,
        discountType: "percentage" as const,
        discountValue: "100.00",
        usageQuota: 1,
        eventId: seeded.eventId,
        promoterId: seeded.promoterId,
        ticketTypeId: seeded.ticketTypeId,
        promoterEventId: seeded.promoterEventId,
        scope: "ticket_type" as const,
      })),
    );

    for (const [index, code] of extraCodes.slice(0, 9).entries()) {
      const orderId = randomUUID();
      const orderItemId = randomUUID();
      const ticketId = randomUUID();
      await client.db.insert(order).values({
        id: orderId,
        orderCode: `ORD-${orderId.slice(0, 8)}`,
        userId: seeded.userId,
        eventId: seeded.eventId,
        subtotal: "50.00",
        total: "50.00",
        status: "paid",
        paidAt: new Date("2026-07-20T12:00:00.000Z"),
      });
      await client.db.insert(orderItem).values({
        id: orderItemId,
        orderId,
        ticketTypeId: seeded.ticketTypeId,
        quantity: 1,
        unitPrice: "50.00",
        lineTotal: "50.00",
      });
      await client.db.insert(ticket).values({
        id: ticketId,
        orderItemId,
        eventId: seeded.eventId,
        ticketTypeId: seeded.ticketTypeId,
        qrCode: `qr-${ticketId}`,
        status: index < 7 ? "used" : "valid",
        usedAt:
          index < 7
            ? new Date(
                `2026-08-02T${String(index + 5).padStart(2, "0")}:30:00.000Z`,
              )
            : null,
      });
      await client.db.insert(attendee).values({
        id: randomUUID(),
        ticketId,
        fullName: `Invitado ${index}`,
        documentType: "dni",
        documentNumber: ticketId.replaceAll("-", "").slice(0, 8),
        birthDate: "1990-01-01",
        isBuyer: true,
      });
      await client.db.insert(promoCodeRedemption).values({
        id: randomUUID(),
        promoCodeId: code.id,
        orderId,
        userId: seeded.userId,
        discountApplied: "50.00",
      });
    }

    const facts = await repo.listFacts({ companyId: seeded.companyId });
    const metrics = calculatePromoterMetrics(
      {
        id: seeded.promoterId,
        name: "Promotor Embudo",
        companyId: seeded.companyId,
      },
      facts,
    );

    expect(metrics.totals).toMatchObject({
      invitedCount: 40,
      redeemedCount: 10,
      attendedCount: 8,
      redemptionRate: 25,
      attendanceRate: 20,
      salesCount: 10,
    });
  });
});
