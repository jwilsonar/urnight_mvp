import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { event, ticketType } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type {
  InventoryPort,
  SaleEvent,
  SaleTicketType,
} from '../../domain/ports/inventory.repository';

/** Adapter de inventario (acoplamiento a nivel de persistencia con events). */
@Injectable()
export class DrizzleInventoryRepository implements InventoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async getEvent(eventId: string): Promise<SaleEvent | null> {
    const [row] = await this.db
      .select({ id: event.id, status: event.status, localId: event.localId })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1);
    if (!row) return null;
    return { id: row.id, status: row.status, localId: row.localId, isOnSale: row.status === 'published' };
  }

  async getTicketType(id: string): Promise<SaleTicketType | null> {
    const [row] = await this.db.select().from(ticketType).where(eq(ticketType.id, id)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      eventId: row.eventId,
      price: Number(row.price),
      currency: row.currency,
      stock: row.stock,
      sold: row.sold,
      maxPerUser: row.maxPerUser,
      status: row.status,
    };
  }

  async incrementSold(ticketTypeId: string, qty: number, tx: unknown): Promise<void> {
    await this.exec(tx)
      .update(ticketType)
      .set({ sold: sql`${ticketType.sold} + ${qty}` })
      .where(eq(ticketType.id, ticketTypeId));
  }

  async incrementEventTicketsSold(eventId: string, qty: number, tx: unknown): Promise<void> {
    await this.exec(tx)
      .update(event)
      .set({ ticketsSold: sql`${event.ticketsSold} + ${qty}` })
      .where(eq(event.id, eventId));
  }

  async incrementEventCheckins(eventId: string, tx?: unknown): Promise<void> {
    await this.exec(tx)
      .update(event)
      .set({ checkinsCount: sql`${event.checkinsCount} + 1` })
      .where(eq(event.id, eventId));
  }
}
