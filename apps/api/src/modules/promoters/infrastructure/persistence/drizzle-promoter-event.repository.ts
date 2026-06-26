import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { event, promoCode, promoterEvent, promoterTicketAllocation, ticketType } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type {
  AllocationDiscountType,
  PromoterAllocationProps,
  PromoterEvent,
} from '../../domain/entities/promoter-event.entity';
import type {
  AllocationSnapshot,
  AllocationView,
  AssignmentView,
  PromoterEventHeader,
  PromoterEventRepository,
  TicketStock,
} from '../../domain/ports/promoter-event.repository';

interface HeadRow {
  id: string;
  promoterId: string;
  eventId: string;
  status: string;
  createdAt: Date;
  eId: string;
  eSlug: string;
  eName: string;
  eStartsAt: Date;
  eFlyer: string | null;
}

@Injectable()
export class DrizzlePromoterEventRepository implements PromoterEventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  /** Cupo ya repartido = nº de códigos generados para (promoter_event, ticket_type). */
  private usedStockSql() {
    return sql<number>`(select count(*)::int from ${promoCode} where ${promoCode.promoterEventId} = ${promoterTicketAllocation.promoterEventId} and ${promoCode.ticketTypeId} = ${promoterTicketAllocation.ticketTypeId})`;
  }

  async create(agg: PromoterEvent, tx?: unknown): Promise<void> {
    const db = this.exec(tx);
    await db.insert(promoterEvent).values({
      id: agg.id,
      promoterId: agg.promoterId,
      eventId: agg.eventId,
      status: agg.status,
      assignedBy: agg.assignedBy,
    });
    if (agg.allocations.length) {
      await db.insert(promoterTicketAllocation).values(
        agg.allocations.map((a) => ({
          promoterEventId: agg.id,
          ticketTypeId: a.ticketTypeId,
          discountType: a.discountType,
          discountValue: a.discountValue.toFixed(2),
          allocatedStock: a.allocatedStock,
        })),
      );
    }
  }

  async deleteByPromoterAndEvent(promoterId: string, eventId: string, tx?: unknown): Promise<void> {
    await this.exec(tx)
      .delete(promoterEvent)
      .where(and(eq(promoterEvent.promoterId, promoterId), eq(promoterEvent.eventId, eventId)));
  }

  async findIdByPromoterAndEvent(promoterId: string, eventId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: promoterEvent.id })
      .from(promoterEvent)
      .where(and(eq(promoterEvent.promoterId, promoterId), eq(promoterEvent.eventId, eventId)))
      .limit(1);
    return row?.id ?? null;
  }

  async replaceAllocations(
    promoterEventId: string,
    allocations: PromoterAllocationProps[],
    tx?: unknown,
  ): Promise<void> {
    const db = this.exec(tx);
    await db
      .delete(promoterTicketAllocation)
      .where(eq(promoterTicketAllocation.promoterEventId, promoterEventId));
    if (allocations.length) {
      await db.insert(promoterTicketAllocation).values(
        allocations.map((a) => ({
          promoterEventId,
          ticketTypeId: a.ticketTypeId,
          discountType: a.discountType,
          discountValue: a.discountValue.toFixed(2),
          allocatedStock: a.allocatedStock,
        })),
      );
    }
  }

  async listTicketStocks(eventId: string): Promise<TicketStock[]> {
    const rows = await this.db
      .select({ ticketTypeId: ticketType.id, stock: ticketType.stock, sold: ticketType.sold })
      .from(ticketType)
      .where(eq(ticketType.eventId, eventId));
    return rows.map((r) => ({
      ticketTypeId: r.ticketTypeId,
      remaining: Math.max(0, r.stock - r.sold),
    }));
  }

  async findHeader(promoterEventId: string): Promise<PromoterEventHeader | null> {
    const [r] = await this.db
      .select({
        id: promoterEvent.id,
        promoterId: promoterEvent.promoterId,
        eventId: promoterEvent.eventId,
        status: promoterEvent.status,
      })
      .from(promoterEvent)
      .where(eq(promoterEvent.id, promoterEventId))
      .limit(1);
    return r ? { ...r, status: r.status as 'active' | 'revoked' } : null;
  }

  async listViewsByPromoter(promoterId: string): Promise<AssignmentView[]> {
    const heads = await this.headQuery(eq(promoterEvent.promoterId, promoterId)).orderBy(
      desc(promoterEvent.createdAt),
    );
    const allocMap = await this.allocationsFor(heads.map((h) => h.id));
    return heads.map((h) => this.toView(h, allocMap.get(h.id) ?? []));
  }

  async findView(promoterEventId: string): Promise<AssignmentView | null> {
    const [h] = await this.headQuery(eq(promoterEvent.id, promoterEventId)).limit(1);
    if (!h) return null;
    const allocMap = await this.allocationsFor([h.id]);
    return this.toView(h, allocMap.get(h.id) ?? []);
  }

  async getAllocation(
    promoterEventId: string,
    ticketTypeId: string,
  ): Promise<AllocationSnapshot | null> {
    const [r] = await this.db
      .select({
        eventId: promoterEvent.eventId,
        ticketTypeId: promoterTicketAllocation.ticketTypeId,
        discountType: promoterTicketAllocation.discountType,
        discountValue: promoterTicketAllocation.discountValue,
        allocatedStock: promoterTicketAllocation.allocatedStock,
        usedStock: this.usedStockSql(),
      })
      .from(promoterTicketAllocation)
      .innerJoin(promoterEvent, eq(promoterTicketAllocation.promoterEventId, promoterEvent.id))
      .where(
        and(
          eq(promoterTicketAllocation.promoterEventId, promoterEventId),
          eq(promoterTicketAllocation.ticketTypeId, ticketTypeId),
        ),
      )
      .limit(1);
    if (!r) return null;
    const used = Number(r.usedStock);
    return {
      promoterEventId,
      eventId: r.eventId,
      ticketTypeId: r.ticketTypeId,
      discountType: r.discountType as AllocationDiscountType,
      discountValue: Number(r.discountValue),
      allocatedStock: r.allocatedStock,
      usedStock: used,
      remaining: Math.max(0, r.allocatedStock - used),
    };
  }

  private headQuery(where: ReturnType<typeof eq>) {
    return this.db
      .select({
        id: promoterEvent.id,
        promoterId: promoterEvent.promoterId,
        eventId: promoterEvent.eventId,
        status: promoterEvent.status,
        createdAt: promoterEvent.createdAt,
        eId: event.id,
        eSlug: event.slug,
        eName: event.name,
        eStartsAt: event.startsAt,
        eFlyer: event.flyerUrl,
      })
      .from(promoterEvent)
      .innerJoin(event, eq(promoterEvent.eventId, event.id))
      .where(where);
  }

  private async allocationsFor(promoterEventIds: string[]): Promise<Map<string, AllocationView[]>> {
    const map = new Map<string, AllocationView[]>();
    if (!promoterEventIds.length) return map;
    const rows = await this.db
      .select({
        promoterEventId: promoterTicketAllocation.promoterEventId,
        ticketTypeId: promoterTicketAllocation.ticketTypeId,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        currency: ticketType.currency,
        discountType: promoterTicketAllocation.discountType,
        discountValue: promoterTicketAllocation.discountValue,
        allocatedStock: promoterTicketAllocation.allocatedStock,
        usedStock: this.usedStockSql(),
      })
      .from(promoterTicketAllocation)
      .innerJoin(ticketType, eq(promoterTicketAllocation.ticketTypeId, ticketType.id))
      .where(inArray(promoterTicketAllocation.promoterEventId, promoterEventIds));
    for (const r of rows) {
      const used = Number(r.usedStock);
      const view: AllocationView = {
        ticketTypeId: r.ticketTypeId,
        ticketTypeName: r.ticketTypeName,
        price: Number(r.price),
        currency: r.currency,
        discountType: r.discountType as AllocationDiscountType,
        discountValue: Number(r.discountValue),
        allocatedStock: r.allocatedStock,
        usedStock: used,
        remaining: Math.max(0, r.allocatedStock - used),
      };
      const arr = map.get(r.promoterEventId) ?? [];
      arr.push(view);
      map.set(r.promoterEventId, arr);
    }
    return map;
  }

  private toView(h: HeadRow, items: AllocationView[]): AssignmentView {
    return {
      id: h.id,
      promoterId: h.promoterId,
      eventId: h.eventId,
      status: h.status as 'active' | 'revoked',
      event: {
        id: h.eId,
        slug: h.eSlug,
        name: h.eName,
        startsAt: h.eStartsAt,
        flyerUrl: h.eFlyer ?? null,
      },
      items,
      createdAt: h.createdAt,
    };
  }
}
