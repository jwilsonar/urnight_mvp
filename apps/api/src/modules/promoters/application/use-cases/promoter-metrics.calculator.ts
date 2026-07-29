import type { Promoter } from '../../domain/entities/promoter.entity';
import type {
  AnalyticsEventStatus,
  PromoterAnalyticsFacts,
  PromoterAttributionFact,
  PromoterTicketFact,
} from '../../domain/ports/promoter-analytics.repository';
import { PROMOTER_COMMISSION_RATE } from '../config/commission';

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
  registeredCount: number;
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
  conflictingOrdersExcluded: number;
}

export interface PromoterAttributedSale {
  orderId: string;
  code: string | null;
  source: 'promo_code' | 'referral' | 'promo_and_referral';
  ticketCount: number;
  amount: number;
  currency: string;
  commissionAmount: number;
  attributedAt: Date;
}

export interface PromoterEventMetrics extends PromoterMetricTotals {
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  excludedReason: 'event_cancelled' | null;
  sales: PromoterAttributedSale[];
}

export interface PromoterMetricsView {
  promoterId: string;
  promoterName: string;
  companyId: string;
  totals: PromoterMetricTotals;
  events: PromoterEventMetrics[];
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
  source: PromoterAttributedSale['source'];
  attributedAt: Date;
  commissionAmount: number;
}

interface Conflict {
  eventId: string;
  promoterIds: Set<string>;
}

interface EventAccumulator {
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  excludedReason: 'event_cancelled' | null;
  orders: CanonicalAttribution[];
  sales: PromoterAttributedSale[];
  entries: Date[];
  registeredCount: number;
  attendedCount: number;
  companionsCount: number;
  companionOrdersKnown: number;
  companionOrdersUnknown: number;
  money: Map<string, { grossAmount: number; commissionAmount: number }>;
  conflictingOrdersExcluded: number;
}

/**
 * Regla financiera: una orden con fuentes que apuntan a promotores distintos es
 * ambigua y se excluye. Si promo + referral apuntan al MISMO promotor, se
 * deduplica la orden, se conserva el código promo y la comisión persistida de
 * sale_attribution; sin comisión persistida se usa la tasa vigente del módulo.
 */
function canonicalizeAttributions(facts: PromoterAnalyticsFacts): {
  canonical: CanonicalAttribution[];
  conflicts: Conflict[];
} {
  const byOrder = new Map<string, PromoterAttributionFact[]>();
  for (const fact of facts.attributions) {
    if (fact.orderStatus !== 'paid') continue;
    if (fact.source === 'referral' && fact.commissionStatus === 'void')
      continue;
    const current = byOrder.get(fact.orderId) ?? [];
    current.push(fact);
    byOrder.set(fact.orderId, current);
  }

  const canonical: CanonicalAttribution[] = [];
  const conflicts: Conflict[] = [];

  for (const rows of byOrder.values()) {
    const promoterIds = new Set(rows.map((row) => row.promoterId));
    if (promoterIds.size !== 1) {
      conflicts.push({ eventId: rows[0]!.eventId, promoterIds });
      continue;
    }

    const base = rows[0]!;
    const promo = rows.find((row) => row.source === 'promo_code');
    const persistedCommission = rows.find(
      (row) => row.source === 'referral' && row.commissionAmount !== null,
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
        promo && rows.some((row) => row.source === 'referral')
          ? 'promo_and_referral'
          : base.source,
      attributedAt: new Date(
        Math.min(...rows.map((row) => row.attributedAt.getTime())),
      ),
      commissionAmount:
        persistedCommission?.commissionAmount ??
        round2(base.orderTotal * PROMOTER_COMMISSION_RATE),
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
    if (ticket.status !== 'valid' && ticket.status !== 'used') continue;
    const previous = unique.get(ticket.ticketId);
    if (!previous || (previous.status !== 'used' && ticket.status === 'used')) {
      unique.set(ticket.ticketId, ticket);
    }
  }
  return [...unique.values()];
}

function hourBucket(date: Date): Date {
  return new Date(Math.floor(date.getTime() / HOUR_MS) * HOUR_MS);
}

function peakHour(entries: Date[]): Date | null {
  if (entries.length === 0) return null;
  const counts = new Map<number, number>();
  for (const entry of entries) {
    const bucket = hourBucket(entry).getTime();
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  const [winner] = [...counts.entries()].sort(
    ([timeA, countA], [timeB, countB]) => countB - countA || timeA - timeB,
  )[0]!;
  return new Date(winner);
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
      input.eventStatus === 'cancelled' ? 'event_cancelled' : null,
    orders: [],
    sales: [],
    entries: [],
    registeredCount: 0,
    attendedCount: 0,
    companionsCount: 0,
    companionOrdersKnown: 0,
    companionOrdersUnknown: 0,
    money: new Map(),
    conflictingOrdersExcluded: 0,
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
    registeredCount: acc.registeredCount,
    attendedCount: acc.attendedCount,
    attendanceRate:
      acc.registeredCount === 0
        ? 0
        : round2((acc.attendedCount / acc.registeredCount) * 100),
    firstEntryAt,
    lastEntryAt,
    peakEntryHourAt: peakHour(acc.entries),
    companionsCount: acc.companionsCount,
    companionOrdersKnown: acc.companionOrdersKnown,
    companionOrdersUnknown: acc.companionOrdersUnknown,
    salesCount: acc.registeredCount,
    attributedOrdersCount: acc.orders.length,
    salesByCurrency: toMoneyMetrics(acc.money),
    conflictingOrdersExcluded: acc.conflictingOrdersExcluded,
    sales: acc.sales,
  };
}

function totalMetrics(accumulators: EventAccumulator[]): PromoterMetricTotals {
  const included = accumulators.filter((acc) => acc.excludedReason === null);
  const registeredCount = included.reduce(
    (sum, acc) => sum + acc.registeredCount,
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
    registeredCount,
    attendedCount,
    attendanceRate:
      registeredCount === 0
        ? 0
        : round2((attendedCount / registeredCount) * 100),
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
    salesCount: registeredCount,
    attributedOrdersCount: included.reduce(
      (sum, acc) => sum + acc.orders.length,
      0,
    ),
    salesByCurrency: toMoneyMetrics(money),
    conflictingOrdersExcluded: accumulators.reduce(
      (sum, acc) => sum + acc.conflictingOrdersExcluded,
      0,
    ),
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
  for (const attribution of facts.attributions) {
    if (attribution.promoterId === promoter.id) ensureEvent(attribution);
  }

  const { canonical, conflicts } = canonicalizeAttributions(facts);
  for (const conflict of conflicts) {
    if (!conflict.promoterIds.has(promoter.id)) continue;
    const eventFact = facts.attributions.find(
      (fact) =>
        fact.eventId === conflict.eventId && fact.promoterId === promoter.id,
    );
    if (eventFact) ensureEvent(eventFact).conflictingOrdersExcluded++;
  }

  for (const order of canonical) {
    if (order.promoterId !== promoter.id) continue;
    const acc = ensureEvent(order);
    if (acc.excludedReason) continue;

    const tickets = eligibleTicketsForOrder(facts, order.orderId);
    acc.orders.push(order);
    acc.registeredCount += tickets.length;
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

    for (const ticket of tickets) {
      if (ticket.status === 'used' && ticket.usedAt) {
        acc.attendedCount++;
        acc.entries.push(ticket.usedAt);
      }
    }

    // `is_buyer` permite reconocer acompañantes solo si la orden tiene un único
    // titular. Cero o varios compradores se reportan como cobertura desconocida.
    const buyerCount = tickets.filter((ticket) => ticket.isBuyer).length;
    if (tickets.length > 0 && buyerCount === 1) {
      acc.companionsCount += tickets.filter((ticket) => !ticket.isBuyer).length;
      acc.companionOrdersKnown++;
    } else if (tickets.length > 0) {
      acc.companionOrdersUnknown++;
    }

    const money = acc.money.get(order.currency) ?? {
      grossAmount: 0,
      commissionAmount: 0,
    };
    money.grossAmount += order.orderTotal;
    money.commissionAmount += order.commissionAmount;
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
  };
}

export function promoterIdentity(promoter: Promoter): PromoterMetricsIdentity {
  return {
    id: promoter.id,
    name: promoter.name,
    companyId: promoter.companyId,
  };
}
