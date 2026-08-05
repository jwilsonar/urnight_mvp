import { describe, expect, it } from "vitest";
import { TenantForbiddenError } from "../../../../shared/errors/tenant-forbidden.error";
import { InMemoryPromoterRepository } from "../../../../shared/testing/in-memory/promoters";
import { PromoterBuilder } from "../../../../shared/testing/builders/promoters";
import type {
  PromoterAnalyticsFacts,
  PromoterAnalyticsFilter,
  PromoterAnalyticsRepository,
} from "../../domain/ports/promoter-analytics.repository";
import {
  GetMyPromoterMetricsUseCase,
  GetPromoterMetricsUseCase,
} from "./get-promoter-metrics.use-case";
import { ListPromoterRankingUseCase } from "./list-promoter-ranking.use-case";

class InMemoryAnalyticsRepository implements PromoterAnalyticsRepository {
  constructor(
    private readonly byCompany: Record<string, PromoterAnalyticsFacts>,
  ) {}

  async listFacts(
    filter: PromoterAnalyticsFilter,
  ): Promise<PromoterAnalyticsFacts> {
    const empty = {
      assignments: [],
      invitationLists: [],
      attributions: [],
      tickets: [],
    };
    if (filter.companyId === null) {
      return Object.values(this.byCompany).reduce<PromoterAnalyticsFacts>(
        (all, facts) => ({
          assignments: [...all.assignments, ...facts.assignments],
          invitationLists: [...all.invitationLists, ...facts.invitationLists],
          attributions: [...all.attributions, ...facts.attributions],
          tickets: [...all.tickets, ...facts.tickets],
        }),
        empty,
      );
    }
    return this.byCompany[filter.companyId] ?? empty;
  }
}

const emptyFacts: PromoterAnalyticsFacts = {
  assignments: [],
  invitationLists: [],
  attributions: [],
  tickets: [],
};

describe("acceso a métricas de promotor", () => {
  it("un promotor obtiene solo el perfil ligado a su usuario, sin aceptar promoterId ajeno", async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId("11111111-1111-1111-1111-111111111111")
        .withCompanyId("company-1")
        .withUserId("user-1")
        .build(),
    );
    promoters.seed(
      new PromoterBuilder()
        .withId("22222222-2222-2222-2222-222222222222")
        .withCompanyId("company-1")
        .withUserId("user-2")
        .build(),
    );
    const useCase = new GetMyPromoterMetricsUseCase(
      promoters,
      new InMemoryAnalyticsRepository({ "company-1": emptyFacts }),
    );

    const result = await useCase.execute({ actorUserId: "user-1", filter: {} });

    expect(result.promoterId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("un admin no puede leer el detalle de un promotor de otra compañía", async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId("22222222-2222-2222-2222-222222222222")
        .withCompanyId("company-2")
        .build(),
    );
    const useCase = new GetPromoterMetricsUseCase(
      promoters,
      new InMemoryAnalyticsRepository({ "company-2": emptyFacts }),
    );

    await expect(
      useCase.execute({
        promoterId: "22222222-2222-2222-2222-222222222222",
        scope: { isSuperAdmin: false, companyId: "company-1" },
        filter: {},
      }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });

  it("el ranking de admin contiene solo promotores de su compañía", async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId("11111111-1111-1111-1111-111111111111")
        .withCompanyId("company-1")
        .build(),
    );
    promoters.seed(
      new PromoterBuilder()
        .withId("22222222-2222-2222-2222-222222222222")
        .withCompanyId("company-2")
        .build(),
    );
    const useCase = new ListPromoterRankingUseCase(
      promoters,
      new InMemoryAnalyticsRepository({
        "company-1": emptyFacts,
        "company-2": emptyFacts,
      }),
    );

    const result = await useCase.execute({
      scope: { isSuperAdmin: false, companyId: "company-1" },
      filter: {},
      sortBy: "sales",
      order: "desc",
    });

    expect(result.rows.map((row) => row.promoterId)).toEqual([
      "11111111-1111-1111-1111-111111111111",
    ]);
  });

  it("deduplica globalmente un conflicto visto por dos promotores de la misma compañía", async () => {
    const promoters = new InMemoryPromoterRepository();
    const firstId = "11111111-1111-1111-1111-111111111111";
    const secondId = "22222222-2222-2222-2222-222222222222";
    for (const promoterId of [firstId, secondId]) {
      promoters.seed(
        new PromoterBuilder()
          .withId(promoterId)
          .withCompanyId("company-1")
          .build(),
      );
    }
    const shared = {
      eventId: "33333333-3333-3333-3333-333333333333",
      eventName: "Evento compartido",
      eventStartsAt: new Date("2026-08-01T03:00:00.000Z"),
      eventStatus: "finished" as const,
      orderId: "44444444-4444-4444-4444-444444444444",
      orderStatus: "paid" as const,
      orderTotal: 100,
      currency: "PEN",
      code: "PROMO",
      attributedAt: new Date("2026-07-01T12:00:00.000Z"),
      commissionAmount: 5,
      commissionStatus: "estimated" as const,
    };
    const useCase = new ListPromoterRankingUseCase(
      promoters,
      new InMemoryAnalyticsRepository({
        "company-1": {
          assignments: [],
          invitationLists: [],
          attributions: [
            { ...shared, promoterId: firstId, source: "promo_code" },
            { ...shared, promoterId: secondId, source: "referral" },
          ],
          tickets: [],
        },
      }),
    );

    const result = await useCase.execute({
      scope: { isSuperAdmin: false, companyId: "company-1" },
      filter: {},
      sortBy: "sales",
      order: "desc",
    });

    expect(result.conflictingOrdersExcluded).toBe(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.orderId).toBe(shared.orderId);
  });

  it("dos promotores de la misma compañía no ven las ventas ni eventos del otro", async () => {
    const promoters = new InMemoryPromoterRepository();
    const firstId = "11111111-1111-1111-1111-111111111111";
    const secondId = "22222222-2222-2222-2222-222222222222";
    promoters.seed(
      new PromoterBuilder()
        .withId(firstId)
        .withCompanyId("company-1")
        .withUserId("user-1")
        .build(),
    );
    promoters.seed(
      new PromoterBuilder()
        .withId(secondId)
        .withCompanyId("company-1")
        .withUserId("user-2")
        .build(),
    );
    const attribution = (
      promoterId: string,
      orderId: string,
      eventId: string,
    ) => ({
      promoterId,
      eventId,
      eventName: `Evento ${promoterId}`,
      eventStartsAt: new Date("2026-08-01T03:00:00.000Z"),
      eventStatus: "finished" as const,
      orderId,
      orderStatus: "paid" as const,
      orderTotal: 100,
      currency: "PEN",
      source: "promo_code" as const,
      code: promoterId,
      attributedAt: new Date("2026-07-01T12:00:00.000Z"),
      commissionAmount: 5,
      commissionStatus: "estimated" as const,
    });
    const companyFacts: PromoterAnalyticsFacts = {
      assignments: [],
      invitationLists: [],
      attributions: [
        attribution(firstId, "order-first", "event-first"),
        attribution(secondId, "order-second", "event-second"),
      ],
      tickets: [
        {
          orderId: "order-first",
          ticketId: "ticket-first",
          status: "valid",
          usedAt: null,
          isBuyer: true,
        },
        {
          orderId: "order-second",
          ticketId: "ticket-second",
          status: "valid",
          usedAt: null,
          isBuyer: true,
        },
      ],
    };
    const useCase = new GetMyPromoterMetricsUseCase(
      promoters,
      new InMemoryAnalyticsRepository({ "company-1": companyFacts }),
    );

    const result = await useCase.execute({
      actorUserId: "user-1",
      filter: {},
    });

    expect(result.events.map((event) => event.eventId)).toEqual([
      "event-first",
    ]);
    expect(
      result.events.flatMap((event) => event.sales).map((sale) => sale.orderId),
    ).toEqual(["order-first"]);
  });

  it("separa ventas propias y del equipo sin incluir un promotor de otra empresa", async () => {
    const promoters = new InMemoryPromoterRepository();
    const headId = "11111111-1111-1111-1111-111111111111";
    const childId = "22222222-2222-2222-2222-222222222222";
    const outsiderId = "33333333-3333-3333-3333-333333333333";
    promoters.seed(
      new PromoterBuilder().withId(headId).withCompanyId("company-1").build(),
    );
    const child = new PromoterBuilder()
      .withId(childId)
      .withCompanyId("company-1")
      .build();
    child.assignParent(headId);
    promoters.seed(child);
    const outsider = new PromoterBuilder()
      .withId(outsiderId)
      .withCompanyId("company-2")
      .build();
    outsider.assignParent(headId);
    promoters.seed(outsider);
    const sale = (promoterId: string, orderId: string) => ({
      promoterId,
      eventId: "44444444-4444-4444-4444-444444444444",
      eventName: "Evento",
      eventStartsAt: new Date("2026-08-01T03:00:00.000Z"),
      eventStatus: "finished" as const,
      orderId,
      orderStatus: "paid" as const,
      orderTotal: 100,
      currency: "PEN",
      source: "referral" as const,
      code: null,
      attributedAt: new Date("2026-07-01T12:00:00.000Z"),
      commissionAmount: 5,
      commissionStatus: "estimated" as const,
    });
    const useCase = new ListPromoterRankingUseCase(
      promoters,
      new InMemoryAnalyticsRepository({
        "company-1": {
          assignments: [],
          invitationLists: [],
          attributions: [
            sale(headId, "order-head"),
            sale(childId, "order-child"),
          ],
          tickets: [],
        },
        "company-2": {
          assignments: [],
          invitationLists: [],
          attributions: [sale(outsiderId, "order-outsider")],
          tickets: [],
        },
      }),
    );

    const result = await useCase.execute({
      scope: { isSuperAdmin: false, companyId: "company-1" },
      filter: {},
      sortBy: "sales",
      order: "desc",
    });

    const head = result.rows.find((row) => row.promoterId === headId);
    expect(head?.ownSales.salesCount).toBe(1);
    expect(head?.teamMemberCount).toBe(1);
    expect(head?.teamSales?.salesCount).toBe(1);
    expect(head?.teamSales?.salesByCurrency).toEqual([
      { currency: "PEN", grossAmount: 100, commissionAmount: 5 },
    ]);
    expect(result.rows).toHaveLength(2);
  });
});
