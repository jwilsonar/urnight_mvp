import type { OrderStatus } from '../../../ticketing/domain/entities/order.entity';
import type { TicketStatus } from '../../../ticketing/domain/entities/ticket.entity';
import type { SaleStatus } from '../entities/sale-attribution.entity';

export type AnalyticsEventStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'cancelled'
  | 'finished';

export interface PromoterAnalyticsFilter {
  /** null = todas las empresas; string = una empresa. */
  companyId: string | null;
  eventId?: string;
  /** Rango inclusivo sobre event.starts_at. */
  from?: Date;
  to?: Date;
}

export interface PromoterEventFact {
  promoterId: string;
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
}

export interface PromoterAttributionFact {
  promoterId: string;
  eventId: string;
  eventName: string;
  eventStartsAt: Date;
  eventStatus: AnalyticsEventStatus;
  orderId: string;
  orderStatus: OrderStatus;
  orderTotal: number;
  currency: string;
  source: 'promo_code' | 'referral';
  code: string | null;
  attributedAt: Date;
  commissionAmount: number | null;
  commissionStatus: SaleStatus | null;
}

export interface PromoterTicketFact {
  orderId: string;
  ticketId: string;
  status: TicketStatus;
  usedAt: Date | null;
  isBuyer: boolean;
}

export interface PromoterAnalyticsFacts {
  assignments: PromoterEventFact[];
  attributions: PromoterAttributionFact[];
  tickets: PromoterTicketFact[];
}

export interface PromoterAnalyticsRepository {
  listFacts(filter: PromoterAnalyticsFilter): Promise<PromoterAnalyticsFacts>;
}

export const PROMOTER_ANALYTICS_REPOSITORY = Symbol(
  'PROMOTER_ANALYTICS_REPOSITORY',
);
