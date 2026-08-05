import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import {
  activeTicketHoldQuantitySql,
  availableCapacitySql,
  ticketHold,
  ticketType,
} from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import {
  TicketHold,
  type TicketHoldStatus,
} from '../../domain/entities/ticket-hold.entity';
import type { TicketHoldRepository } from '../../domain/ports/ticket-hold.repository';

type Row = typeof ticketHold.$inferSelect;

@Injectable()
export class DrizzleTicketHoldRepository implements TicketHoldRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(entity: TicketHold, tx?: unknown): Promise<TicketHold> {
    const [row] = await this.exec(tx)
      .insert(ticketHold)
      .values({
        id: entity.id,
        eventId: entity.eventId,
        ticketTypeId: entity.ticketTypeId,
        orderId: entity.orderId,
        userId: entity.userId,
        quantity: entity.quantity,
        status: entity.status,
        expiresAt: entity.expiresAt,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el hold de entradas');
    return this.toDomain(row);
  }

  async findById(id: string, tx?: unknown): Promise<TicketHold | null> {
    const [row] = await this.exec(tx)
      .select()
      .from(ticketHold)
      .where(eq(ticketHold.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string, tx: unknown): Promise<TicketHold | null> {
    const [row] = await this.exec(tx)
      .select()
      .from(ticketHold)
      .where(eq(ticketHold.id, id))
      .limit(1)
      .for('update');
    return row ? this.toDomain(row) : null;
  }

  async update(entity: TicketHold, tx?: unknown): Promise<TicketHold> {
    const [row] = await this.exec(tx)
      .update(ticketHold)
      .set({
        orderId: entity.orderId,
        status: entity.status,
        updatedAt: entity.updatedAt,
      })
      .where(eq(ticketHold.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el hold de entradas');
    return this.toDomain(row);
  }

  async availableCapacity(
    ticketTypeId: string,
    at: Date,
    tx?: unknown,
  ): Promise<number> {
    const activeHolds = activeTicketHoldQuantitySql(ticketType.id, at);
    const [row] = await this.exec(tx)
      .select({
        available: availableCapacitySql(
          ticketType.stock,
          ticketType.sold,
          activeHolds,
        ),
      })
      .from(ticketType)
      .where(eq(ticketType.id, ticketTypeId))
      .limit(1);
    return Number(row?.available ?? 0);
  }

  async expireStale(at: Date, tx?: unknown): Promise<number> {
    const rows = await this.exec(tx)
      .update(ticketHold)
      .set({ status: 'expired', updatedAt: at })
      .where(
        and(
          eq(ticketHold.status, 'active'),
          lte(ticketHold.expiresAt, at),
        ),
      )
      .returning({ id: ticketHold.id });
    return rows.length;
  }

  private toDomain(row: Row): TicketHold {
    return TicketHold.fromPersistence({
      id: row.id,
      eventId: row.eventId,
      ticketTypeId: row.ticketTypeId,
      orderId: row.orderId,
      userId: row.userId,
      quantity: row.quantity,
      status: row.status as TicketHoldStatus,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
