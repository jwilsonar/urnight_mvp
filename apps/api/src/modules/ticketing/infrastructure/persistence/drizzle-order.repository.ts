import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import { order, orderItem } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { Order, OrderItem, type OrderStatus } from '../../domain/entities/order.entity';
import type { OrderRepository } from '../../domain/ports/order.repository';

type OrderRow = typeof order.$inferSelect;
type ItemRow = typeof orderItem.$inferSelect;

@Injectable()
export class DrizzleOrderRepository implements OrderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(entity: Order, tx?: unknown): Promise<Order> {
    const db = this.exec(tx);
    await db.insert(order).values({
      id: entity.id,
      orderCode: entity.orderCode,
      userId: entity.userId,
      eventId: entity.eventId,
      subtotal: entity.subtotal.toFixed(2),
      discountTotal: entity.discountTotal.toFixed(2),
      commissionAmount: entity.commissionAmount.toFixed(2),
      total: entity.total.toFixed(2),
      currency: entity.currency,
      status: entity.status,
      paidAt: entity.paidAt,
    });
    if (entity.items.length > 0) {
      await db.insert(orderItem).values(
        entity.items.map((i) => ({
          id: i.id,
          orderId: entity.id,
          ticketTypeId: i.ticketTypeId,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toFixed(2),
          lineTotal: i.lineTotal.toFixed(2),
        })),
      );
    }
    return entity;
  }

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(order).where(eq(order.id, id)).limit(1);
    if (!row) return null;
    const items = await this.db.select().from(orderItem).where(eq(orderItem.orderId, id));
    return this.toDomain(row, items);
  }

  async findByUser(userId: string): Promise<Order[]> {
    const rows = await this.db
      .select()
      .from(order)
      .where(eq(order.userId, userId))
      .orderBy(desc(order.createdAt));
    if (rows.length === 0) return [];
    const items = await this.db
      .select()
      .from(orderItem)
      .where(inArray(orderItem.orderId, rows.map((r) => r.id)));
    return rows.map((r) => this.toDomain(r, items.filter((i) => i.orderId === r.id)));
  }

  async update(entity: Order, tx?: unknown): Promise<Order> {
    await this.exec(tx)
      .update(order)
      .set({
        status: entity.status,
        paidAt: entity.paidAt,
        discountTotal: entity.discountTotal.toFixed(2),
        total: entity.total.toFixed(2),
      })
      .where(eq(order.id, entity.id));
    return entity;
  }

  private toDomain(row: OrderRow, items: ItemRow[]): Order {
    return Order.fromPersistence({
      id: row.id,
      orderCode: row.orderCode,
      userId: row.userId,
      eventId: row.eventId,
      subtotal: Number(row.subtotal),
      discountTotal: Number(row.discountTotal),
      commissionAmount: Number(row.commissionAmount),
      total: Number(row.total),
      currency: row.currency,
      status: row.status as OrderStatus,
      items: items.map((i) =>
        OrderItem.fromPersistence({
          id: i.id,
          ticketTypeId: i.ticketTypeId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        }),
      ),
      createdAt: row.createdAt,
      paidAt: row.paidAt,
    });
  }
}
