import { PROMOTER_ANALYTICS_TIME_ZONE } from "@urnight/contracts";
import type { Promoter } from "../../domain/entities/promoter.entity";
import type {
  AnalyticsEventStatus,
  PromoterAnalyticsFacts,
  PromoterAttributionFact,
  PromoterTicketFact,
} from "../../domain/ports/promoter-analytics.repository";

const HOUR_MS = 60 * 60 * 1000;

const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface PromoterMetricsIdentity {
  id: string;
  name: string;
  companyId: string;
}

export interface PromoterMoneyMetric {
  currency: string;
  grossAmount: number;
  commissionAmount: number;
}

export interface PromoterMetricTotals {
  allocatedCount: number;
  invitedCount: number;
  redeemedCount: number;
  redemptionRate: number;
  attendedCount: number;
  attendanceRate: number;
  firstEntryAt: Date | null;
  lastEntryAt: Date | null;
  peakEntryHourAt: Date | null;
  companionsCount: number;
  companionOrdersKnown: number;
  companionOrdersUnknown: number;
  salesCount: number;
  attributedOrdersCount: number;
  salesByCurrency: PromoterMoneyMetric[];
  commissionPendingCount: number;
  conflictingOrdersExcluded: number;
}

export interface PromoterAttributedSale {
  orderId: string;
  code: string | null;
  source: "promo_code" | "referral" | "promo_and_referral";
  ticketCount: number;
  amount: number;
  currency: string;
  commissionAmount: number | null;
  attributedAt: Date;
}

export interface PromoterEventMetrics extends PromoterMetricTotals {
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  excludedReason: "event_cancelled" | null;
  sales: PromoterAttributedSale[];
}

export interface PromoterMetricsView {
  promoterId: string;
  promoterName: string;
  companyId: string;
  totals: PromoterMetricTotals;
  events: PromoterEventMetrics[];
  conflicts: PromoterAttributionConflict[];
}

export interface PromoterAttributionConflict {
  orderId: string;
  eventId: string;
  eventName: string;
  amount: number;
  currency: string;
  promoterIds: string[];
}

interface CanonicalAttribution {
  promoterId: string;
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  orderId: string;
  orderTotal: number;
  currency: string;
  code: string | null;
  source: PromoterAttributedSale["source"];
  attributedAt: Date;
  commissionAmount: number | null;
}

interface EventAccumulator {
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  excludedReason: "event_cancelled" | null;
  orders: CanonicalAttribution[];
  sales: PromoterAttributedSale[];
  entries: Date[];
  allocatedCount: number;
  invitedCodeIds: Set<string>;
  redeemedCount: number;
  attendedCount: number;
  companionsCount: number;
  companionOrdersKnown: number;
  companionOrdersUnknown: number;
  money: Map<string, { grossAmount: number; commissionAmount: number }>;
  commissionPendingCount: number;
  conflictingOrderIds: Set<string>;
}

/**
 * Regla financiera: una orden con fuentes que apuntan a promotores distintos es
 * ambigua y se excluye. Si promo + referral apuntan al MISMO promotor, se
 * deduplica la orden, se conserva el código promo y la comisión persistida de
 * sale_attribution. Sin snapshot la comisión queda pendiente; nunca se recalcula.
 */
function canonicalizeAttributions(facts: PromoterAnalyticsFacts): {
  canonical: CanonicalAttribution[];
  conflicts: PromoterAttributionConflict[];
} {
  const byOrder = new Map<string, PromoterAttributionFact[]>();
  for (const fact of facts.attributions) {
    if (fact.orderStatus !== "paid") continue;
    if (fact.source === "referral" && fact.commissionStatus === "void")
      continue;
    const current = byOrder.get(fact.orderId) ?? [];
    current.push(fact);
    byOrder.set(fact.orderId, current);
  }

  const canonical: CanonicalAttribution[] = [];
  const conflicts: PromoterAttributionConflict[] = [];

  for (const [orderId, rows] of byOrder) {
    const promoterIds = new Set(rows.map((row) => row.promoterId));
    if (promoterIds.size !== 1) {
      const base = rows[0]!;
      conflicts.push({
        orderId,
        eventId: base.eventId,
        eventName: base.eventName,
        amount: base.orderTotal,
        currency: base.currency,
        promoterIds: [...promoterIds].sort(),
      });
      continue;
    }

    const base = rows[0]!;
    const promo = rows.find((row) => row.source === "promo_code");
    const persistedCommission = rows.find(
      (row) => row.commissionAmount !== null,
    );
    canonical.push({
      promoterId: base.promoterId,
      eventId: base.eventId,
      eventName: base.eventName,
      eventStartsAt: base.eventStartsAt,
      eventStatus: base.eventStatus,
      orderId: base.orderId,
      orderTotal: base.orderTotal,
      currency: base.currency,
      code: promo?.code ?? base.code,
      source:
        promo && rows.some((row) => row.source === "referral")
          ? "promo_and_referral"
          : base.source,
      attributedAt: new Date(
        Math.min(...rows.map((row) => row.attributedAt.getTime())),
      ),
      commissionAmount: persistedCommission?.commissionAmount ?? null,
    });
  }

  return { canonical, conflicts };
}

/**
 * Un ticket cuenta como "asistió" solo si la validación exitosa de puerta lo
 * dejó `used` CON `used_at`. Se deduplica por ticket_id: los intentos
 * `already_used` viven en qr_validation pero nunca generan una segunda persona.
 * Tickets cancelled/expired no forman parte de la lista; órdenes no pagadas,
 * reembolsadas o canceladas ya fueron excluidas de las atribuciones.
 */
function eligibleTicketsForOrder(
  facts: PromoterAnalyticsFacts,
  orderId: string,
): PromoterTicketFact[] {
  const unique = new Map<string, PromoterTicketFact>();
  for (const ticket of facts.tickets) {
    if (ticket.orderId !== orderId) continue;
    if (ticket.status !== "valid" && ticket.status !== "used") continue;
    const previous = unique.get(ticket.ticketId);
    if (!previous || (previous.status !== "used" && ticket.status === "used")) {
      unique.set(ticket.ticketId, ticket);
    }
  }
  return [...unique.values()];
}

const peakHourParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: PROMOTER_ANALYTICS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

function hourBucketKey(date: Date): string {
  return peakHourParts
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => `${part.type}:${part.value}`)
    .join("|");
}

function peakHour(entries: Date[]): Date | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, { count: number; at: Date }>();
  for (const entry of entries) {
    const bucket = hourBucketKey(entry);
    const current = counts.get(bucket);
    counts.set(bucket, {
      count: (current?.count ?? 0) + 1,
      at:
        current?.at ??
        new Date(Math.floor(entry.getTime() / HOUR_MS) * HOUR_MS),
    });
  }
  const [, winner] = [...counts.entries()].sort(
    ([, a], [, b]) => b.count - a.count || a.at.getTime() - b.at.getTime(),
  )[0]!;
  return winner.at;
}

function createAccumulator(input: {
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
}): EventAccumulator {
  return {
    ...input,
    excludedReason:
      input.eventStatus === "cancelled" ? "event_cancelled" : null,
    orders: [],
    sales: [],
    entries: [],
    allocatedCount: 0,
    invitedCodeIds: new Set(),
    redeemedCount: 0,
    attendedCount: 0,
    companionsCount: 0,
    companionOrdersKnown: 0,
    companionOrdersUnknown: 0,
    money: new Map(),
    commissionPendingCount: 0,
    conflictingOrderIds: new Set(),
  };
}

function toMoneyMetrics(
  money: Map<string, { grossAmount: number; commissionAmount: number }>,
): PromoterMoneyMetric[] {
  return [...money.entries()]
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, amounts]) => ({
      currency,
      grossAmount: round2(amounts.grossAmount),
      commissionAmount: round2(amounts.commissionAmount),
    }));
}

function toEventMetrics(acc: EventAccumulator): PromoterEventMetrics {
  const invitedCount = acc.invitedCodeIds.size;
  const firstEntryAt =
    acc.entries.length === 0
      ? null
      : new Date(Math.min(...acc.entries.map((entry) => entry.getTime())));
  const lastEntryAt =
    acc.entries.length === 0
      ? null
      : new Date(Math.max(...acc.entries.map((entry) => entry.getTime())));
  return {
    eventId: acc.eventId,
    eventName: acc.eventName,
    eventStartsAt: acc.eventStartsAt,
    eventStatus: acc.eventStatus,
    excludedReason: acc.excludedReason,
    allocatedCount: acc.allocatedCount,
    invitedCount,
    redeemedCount: acc.redeemedCount,
    redemptionRate:
      invitedCount === 0 ? 0 : round2((acc.redeemedCount / invitedCount) * 100),
    attendedCount: acc.attendedCount,
    attendanceRate:
      invitedCount === 0 ? 0 : round2((acc.attendedCount / invitedCount) * 100),
    firstEntryAt,
    lastEntryAt,
    peakEntryHourAt: peakHour(acc.entries),
    companionsCount: acc.companionsCount,
    companionOrdersKnown: acc.companionOrdersKnown,
    companionOrdersUnknown: acc.companionOrdersUnknown,
    salesCount: acc.orders.length,
    attributedOrdersCount: acc.orders.length,
    salesByCurrency: toMoneyMetrics(acc.money),
    commissionPendingCount: acc.commissionPendingCount,
    conflictingOrdersExcluded: acc.conflictingOrderIds.size,
    sales: acc.sales,
  };
}

function totalMetrics(accumulators: EventAccumulator[]): PromoterMetricTotals {
  const included = accumulators.filter((acc) => acc.excludedReason === null);
  const allocatedCount = included.reduce(
    (sum, acc) => sum + acc.allocatedCount,
    0,
  );
  const invitedCount = included.reduce(
    (sum, acc) => sum + acc.invitedCodeIds.size,
    0,
  );
  const redeemedCount = included.reduce(
    (sum, acc) => sum + acc.redeemedCount,
    0,
  );
  const attendedCount = included.reduce(
    (sum, acc) => sum + acc.attendedCount,
    0,
  );
  const entries = included.flatMap((acc) => acc.entries);
  const money = new Map<
    string,
    { grossAmount: number; commissionAmount: number }
  >();
  for (const acc of included) {
    for (const [currency, amounts] of acc.money) {
      const total = money.get(currency) ?? {
        grossAmount: 0,
        commissionAmount: 0,
      };
      total.grossAmount += amounts.grossAmount;
      total.commissionAmount += amounts.commissionAmount;
      money.set(currency, total);
    }
  }

  return {
    allocatedCount,
    invitedCount,
    redeemedCount,
    redemptionRate:
      invitedCount === 0 ? 0 : round2((redeemedCount / invitedCount) * 100),
    attendedCount,
    attendanceRate:
      invitedCount === 0 ? 0 : round2((attendedCount / invitedCount) * 100),
    firstEntryAt:
      entries.length === 0
        ? null
        : new Date(Math.min(...entries.map((entry) => entry.getTime()))),
    lastEntryAt:
      entries.length === 0
        ? null
        : new Date(Math.max(...entries.map((entry) => entry.getTime()))),
    peakEntryHourAt: peakHour(entries),
    companionsCount: included.reduce(
      (sum, acc) => sum + acc.companionsCount,
      0,
    ),
    companionOrdersKnown: included.reduce(
      (sum, acc) => sum + acc.companionOrdersKnown,
      0,
    ),
    companionOrdersUnknown: included.reduce(
      (sum, acc) => sum + acc.companionOrdersUnknown,
      0,
    ),
    salesCount: included.reduce((sum, acc) => sum + acc.orders.length, 0),
    attributedOrdersCount: included.reduce(
      (sum, acc) => sum + acc.orders.length,
      0,
    ),
    salesByCurrency: toMoneyMetrics(money),
    commissionPendingCount: included.reduce(
      (sum, acc) => sum + acc.commissionPendingCount,
      0,
    ),
    conflictingOrdersExcluded: new Set(
      accumulators.flatMap((acc) => [...acc.conflictingOrderIds]),
    ).size,
  };
}

export function calculatePromoterMetrics(
  promoter: PromoterMetricsIdentity,
  facts: PromoterAnalyticsFacts,
): PromoterMetricsView {
  const eventMap = new Map<string, EventAccumulator>();
  const ensureEvent = (event: {
    eventId: string;
    eventName: string;
    eventStartsAt: Date;
    eventStatus: AnalyticsEventStatus;
  }): EventAccumulator => {
    const existing = eventMap.get(event.eventId);
    if (existing) return existing;
    const created = createAccumulator(event);
    eventMap.set(event.eventId, created);
    return created;
  };

  for (const assignment of facts.assignments) {
    if (assignment.promoterId === promoter.id) ensureEvent(assignment);
  }
  for (const list of facts.invitationLists) {
    if (list.promoterId !== promoter.id) continue;
    const acc = ensureEvent(list);
    acc.allocatedCount += list.allocatedStock;
    for (const code of list.issuedCodes) acc.invitedCodeIds.add(code.id);
  }
  for (const attribution of facts.attributions) {
    if (attribution.promoterId === promoter.id) ensureEvent(attribution);
  }

  const { canonical, conflicts } = canonicalizeAttributions(facts);
  for (const conflict of conflicts) {
    if (!conflict.promoterIds.includes(promoter.id)) continue;
    const eventFact = facts.attributions.find(
      (fact) =>
        fact.eventId === conflict.eventId && fact.promoterId === promoter.id,
    );
    if (eventFact) {
      ensureEvent(eventFact).conflictingOrderIds.add(conflict.orderId);
    }
  }

  for (const order of canonical) {
    if (order.promoterId !== promoter.id) continue;
    const acc = ensureEvent(order);
    if (acc.excludedReason) continue;

    const tickets = eligibleTicketsForOrder(facts, order.orderId);
    acc.orders.push(order);
    acc.sales.push({
      orderId: order.orderId,
      code: order.code,
      source: order.source,
      ticketCount: tickets.length,
      amount: order.orderTotal,
      currency: order.currency,
      commissionAmount: order.commissionAmount,
      attributedAt: order.attributedAt,
    });

    const isRedeemedInvitation =
      order.source === "promo_code" || order.source === "promo_and_referral";
    if (isRedeemedInvitation) {
      acc.redeemedCount++;
      for (const ticket of tickets) {
        if (ticket.status === "used" && ticket.usedAt) {
          acc.attendedCount++;
          acc.entries.push(ticket.usedAt);
        }
      }

      // `is_buyer` permite reconocer acompañantes solo si la orden tiene un único
      // titular. Cero o varios compradores se reportan como cobertura desconocida.
      const buyerCount = tickets.filter((ticket) => ticket.isBuyer).length;
      if (tickets.length > 0 && buyerCount === 1) {
        acc.companionsCount += tickets.filter(
          (ticket) => !ticket.isBuyer,
        ).length;
        acc.companionOrdersKnown++;
      } else if (tickets.length > 0) {
        acc.companionOrdersUnknown++;
      }
    }

    const money = acc.money.get(order.currency) ?? {
      grossAmount: 0,
      commissionAmount: 0,
    };
    money.grossAmount += order.orderTotal;
    if (order.commissionAmount === null) {
      acc.commissionPendingCount++;
    } else {
      money.commissionAmount += order.commissionAmount;
    }
    acc.money.set(order.currency, money);
  }

  const accumulators = [...eventMap.values()];
  return {
    promoterId: promoter.id,
    promoterName: promoter.name,
    companyId: promoter.companyId,
    totals: totalMetrics(accumulators),
    events: accumulators
      .sort((a, b) => b.eventStartsAt.getTime() - a.eventStartsAt.getTime())
      .map(toEventMetrics),
    conflicts: conflicts.filter((conflict) =>
      conflict.promoterIds.includes(promoter.id),
    ),
  };
}

export function promoterIdentity(promoter: Promoter): PromoterMetricsIdentity {
  return {
    id: promoter.id,
    name: promoter.name,
    companyId: promoter.companyId,
  };
}
