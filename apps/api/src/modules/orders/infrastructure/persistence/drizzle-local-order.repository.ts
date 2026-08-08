import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  localOrder as localOrderTable,
  localOrderItem as localOrderItemTable,
  type LocalOrderRow,
} from '@urnight/db';
import type {
  LocalOrderPaymentMethod,
  LocalOrderPaymentStatus,
  LocalOrderStatus,
} from '@urnight/contracts';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import type { LocalOrderRepository } from '../../domain/ports/local-order.repository';

type ItemRow = typeof localOrderItemTable.$inferSelect;

@Injectable()
export class DrizzleLocalOrderRepository implements LocalOrderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(order: LocalOrder, tx?: unknown): Promise<LocalOrder> {
    const exec = this.exec(tx);
    await exec.insert(localOrderTable).values(this.orderValues(order));
    if (order.items.length > 0) {
      await exec.insert(localOrderItemTable).values(
        order.items.map((item) => ({
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitAmount: item.unitAmount.toFixed(2),
          lineAmount: item.lineAmount.toFixed(2),
        })),
      );
    }
    return order;
  }

  async save(order: LocalOrder, tx?: unknown): Promise<LocalOrder> {
    const [row] = await this.exec(tx)
      .update(localOrderTable)
      .set({
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt,
        updatedAt: order.updatedAt,
      })
      .where(eq(localOrderTable.id, order.id))
      .returning({ id: localOrderTable.id });
    if (!row) throw new Error('No se pudo actualizar el pedido.');
    return order;
  }

  async findById(id: string, tx?: unknown, lock = false): Promise<LocalOrder | null> {
    const exec = this.exec(tx);
    const query = exec.select().from(localOrderTable).where(eq(localOrderTable.id, id)).limit(1);
    const rows = lock ? await query.for('update') : await query;
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row, await this.itemsFor([row.id], exec));
  }

  async findMine(id: string, userId: string, tx?: unknown): Promise<LocalOrder | null> {
    const exec = this.exec(tx);
    const [row] = await exec
      .select()
      .from(localOrderTable)
      .where(and(eq(localOrderTable.id, id), eq(localOrderTable.userId, userId)))
      .limit(1);
    return row ? this.toDomain(row, await this.itemsFor([row.id], exec)) : null;
  }

  async listByLocal(localId: string): Promise<LocalOrder[]> {
    const rows = await this.db
      .select()
      .from(localOrderTable)
      .where(eq(localOrderTable.localId, localId))
      .orderBy(asc(localOrderTable.createdAt), asc(localOrderTable.id));
    const items = await this.itemsFor(
      rows.map((row) => row.id),
      this.db,
    );
    return rows.map((row) => this.toDomain(row, items));
  }

  async isOpenPickupCode(
    localId: string,
    pickupCode: string,
    tx?: unknown,
  ): Promise<boolean> {
    const [row] = await this.exec(tx)
      .select({ id: localOrderTable.id })
      .from(localOrderTable)
      .where(
        and(
          eq(localOrderTable.localId, localId),
          eq(localOrderTable.pickupCode, pickupCode),
          inArray(localOrderTable.status, ['received', 'preparing', 'ready']),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  private async itemsFor(
    orderIds: string[],
    exec: DrizzleDb | Tx,
  ): Promise<Map<string, ItemRow[]>> {
    const grouped = new Map<string, ItemRow[]>();
    if (orderIds.length === 0) return grouped;
    const rows = await exec
      .select()
      .from(localOrderItemTable)
      .where(inArray(localOrderItemTable.orderId, orderIds))
      .orderBy(asc(localOrderItemTable.createdAt), asc(localOrderItemTable.id));
    for (const row of rows) {
      const current = grouped.get(row.orderId) ?? [];
      current.push(row);
      grouped.set(row.orderId, current);
    }
    return grouped;
  }

  private toDomain(row: LocalOrderRow, items: Map<string, ItemRow[]>): LocalOrder {
    return LocalOrder.fromPersistence({
      id: row.id,
      localId: row.localId,
      userId: row.userId,
      attendeeName: row.attendeeName,
      pickupCode: row.pickupCode,
      pickupZone: row.pickupZone,
      status: row.status as LocalOrderStatus,
      paymentMethod: row.paymentMethod as LocalOrderPaymentMethod,
      paymentStatus: row.paymentStatus as LocalOrderPaymentStatus,
      totalAmount: Number(row.totalAmount),
      currency: row.currency,
      items: (items.get(row.id) ?? []).map((item) =>
        LocalOrderItem.fromPersistence({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitAmount: Number(item.unitAmount),
          lineAmount: Number(item.lineAmount),
        }),
      ),
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private orderValues(order: LocalOrder) {
    return {
      id: order.id,
      localId: order.localId,
      userId: order.userId,
      attendeeName: order.attendeeName,
      pickupCode: order.pickupCode,
      pickupZone: order.pickupZone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount.toFixed(2),
      currency: order.currency,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
