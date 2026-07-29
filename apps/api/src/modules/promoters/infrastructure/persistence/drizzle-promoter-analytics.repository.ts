import { Inject, Injectable } from '@nestjs/common';
import {
  attendee,
  event,
  local,
  order,
  orderItem,
  promoCode,
  promoCodeRedemption,
  promoter,
  promoterEvent,
  referralLink,
  saleAttribution,
  ticket,
} from '@urnight/db';
import { and, eq, gte, inArray, lte, ne, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { OrderStatus } from '../../../ticketing/domain/entities/order.entity';
import type { TicketStatus } from '../../../ticketing/domain/entities/ticket.entity';
import type { SaleStatus } from '../../domain/entities/sale-attribution.entity';
import type {
  AnalyticsEventStatus,
  PromoterAnalyticsFacts,
  PromoterAnalyticsFilter,
  PromoterAnalyticsRepository,
} from '../../domain/ports/promoter-analytics.repository';

@Injectable()
export class DrizzlePromoterAnalyticsRepository implements PromoterAnalyticsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private scopeConditions(filter: PromoterAnalyticsFilter): SQL[] {
    const conditions: SQL[] = [];
    if (filter.companyId !== null) {
      // Doble barrera: el evento y el promotor deben pertenecer al mismo tenant
      // pedido por application; una FK cruzada histórica no puede filtrar datos.
      conditions.push(eq(local.companyId, filter.companyId));
      conditions.push(eq(promoter.companyId, filter.companyId));
    }
    if (filter.eventId) conditions.push(eq(event.id, filter.eventId));
    if (filter.from) conditions.push(gte(event.startsAt, filter.from));
    if (filter.to) conditions.push(lte(event.startsAt, filter.to));
    return conditions;
  }

  async listFacts(
    filter: PromoterAnalyticsFilter,
  ): Promise<PromoterAnalyticsFacts> {
    const scoped = this.scopeConditions(filter);
    const [assignmentRows, promoRows, referralRows] = await Promise.all([
      this.db
        .select({
          promoterId: promoter.id,
          eventId: event.id,
          eventName: event.name,
          eventStartsAt: event.startsAt,
          eventStatus: event.status,
        })
        .from(promoterEvent)
        .innerJoin(promoter, eq(promoterEvent.promoterId, promoter.id))
        .innerJoin(event, eq(promoterEvent.eventId, event.id))
        .innerJoin(local, eq(event.localId, local.id))
        .where(and(eq(promoterEvent.status, 'active'), ...scoped)),
      this.db
        .select({
          promoterId: promoter.id,
          eventId: event.id,
          eventName: event.name,
          eventStartsAt: event.startsAt,
          eventStatus: event.status,
          orderId: order.id,
          orderStatus: order.status,
          orderTotal: order.total,
          currency: order.currency,
          code: promoCode.code,
          attributedAt: promoCodeRedemption.redeemedAt,
        })
        .from(promoCodeRedemption)
        .innerJoin(promoCode, eq(promoCodeRedemption.promoCodeId, promoCode.id))
        .innerJoin(promoter, eq(promoCode.promoterId, promoter.id))
        .innerJoin(order, eq(promoCodeRedemption.orderId, order.id))
        .innerJoin(event, eq(order.eventId, event.id))
        .innerJoin(local, eq(event.localId, local.id))
        .where(and(eq(order.status, 'paid'), ...scoped)),
      this.db
        .select({
          promoterId: promoter.id,
          eventId: event.id,
          eventName: event.name,
          eventStartsAt: event.startsAt,
          eventStatus: event.status,
          orderId: order.id,
          orderStatus: order.status,
          orderTotal: order.total,
          currency: order.currency,
          code: referralLink.code,
          attributedAt: saleAttribution.attributedAt,
          commissionAmount: saleAttribution.commissionAmount,
          commissionStatus: saleAttribution.status,
        })
        .from(saleAttribution)
        .innerJoin(promoter, eq(saleAttribution.promoterId, promoter.id))
        .innerJoin(order, eq(saleAttribution.orderId, order.id))
        .innerJoin(event, eq(order.eventId, event.id))
        .innerJoin(local, eq(event.localId, local.id))
        .leftJoin(
          referralLink,
          eq(saleAttribution.referralLinkId, referralLink.id),
        )
        .where(
          and(
            eq(order.status, 'paid'),
            ne(saleAttribution.status, 'void'),
            ...scoped,
          ),
        ),
    ]);

    const attributions: PromoterAnalyticsFacts['attributions'] = [
      ...promoRows.map((row) => ({
        promoterId: row.promoterId,
        eventId: row.eventId,
        eventName: row.eventName,
        eventStartsAt: row.eventStartsAt,
        eventStatus: row.eventStatus as AnalyticsEventStatus,
        orderId: row.orderId,
        orderStatus: row.orderStatus as OrderStatus,
        orderTotal: Number(row.orderTotal),
        currency: row.currency,
        source: 'promo_code' as const,
        code: row.code,
        attributedAt: row.attributedAt,
        commissionAmount: null,
        commissionStatus: null,
      })),
      ...referralRows.map((row) => ({
        promoterId: row.promoterId,
        eventId: row.eventId,
        eventName: row.eventName,
        eventStartsAt: row.eventStartsAt,
        eventStatus: row.eventStatus as AnalyticsEventStatus,
        orderId: row.orderId,
        orderStatus: row.orderStatus as OrderStatus,
        orderTotal: Number(row.orderTotal),
        currency: row.currency,
        source: 'referral' as const,
        code: row.code ?? null,
        attributedAt: row.attributedAt,
        commissionAmount: Number(row.commissionAmount),
        commissionStatus: row.commissionStatus as SaleStatus,
      })),
    ];

    const orderIds = [...new Set(attributions.map((fact) => fact.orderId))];
    // Esta lectura por IDs es correcta para el MVP, pero no debe crecer sin
    // límite. Al superar decenas de miles de órdenes conviene una proyección
    // agregada por promotor/evento, actualizada al pagar y validar.
    const ticketRows =
      orderIds.length === 0
        ? []
        : await this.db
            .select({
              orderId: orderItem.orderId,
              ticketId: ticket.id,
              status: ticket.status,
              usedAt: ticket.usedAt,
              isBuyer: attendee.isBuyer,
            })
            .from(ticket)
            .innerJoin(orderItem, eq(ticket.orderItemId, orderItem.id))
            .innerJoin(attendee, eq(attendee.ticketId, ticket.id))
            .where(inArray(orderItem.orderId, orderIds));

    return {
      assignments: assignmentRows.map((row) => ({
        promoterId: row.promoterId,
        eventId: row.eventId,
        eventName: row.eventName,
        eventStartsAt: row.eventStartsAt,
        eventStatus: row.eventStatus as AnalyticsEventStatus,
      })),
      attributions,
      tickets: ticketRows.map((row) => ({
        orderId: row.orderId,
        ticketId: row.ticketId,
        status: row.status as TicketStatus,
        usedAt: row.usedAt,
        isBuyer: row.isBuyer,
      })),
    };
  }
}
