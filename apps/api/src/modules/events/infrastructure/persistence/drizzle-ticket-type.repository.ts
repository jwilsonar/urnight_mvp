import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, getTableColumns } from 'drizzle-orm';
import {
  activeTicketHoldQuantitySql,
  availableCapacitySql,
  ticketType,
} from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import {
  TicketType,
  type TicketTier,
  type TicketTypeStatus,
} from '../../domain/entities/ticket-type.entity';
import type { TicketTypeRepository } from '../../domain/ports/ticket-type.repository';

type Row = typeof ticketType.$inferSelect;
type RowWithAvailability = Row & { available: number };

@Injectable()
export class DrizzleTicketTypeRepository implements TicketTypeRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<TicketType | null> {
    const [row] = await this.db
      .select(this.selection())
      .from(ticketType)
      .where(eq(ticketType.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async listByEvent(eventId: string): Promise<TicketType[]> {
    const rows = await this.db
      .select(this.selection())
      .from(ticketType)
      .where(eq(ticketType.eventId, eventId))
      .orderBy(asc(ticketType.price));
    return rows.map((r) => this.toDomain(r));
  }

  async create(entity: TicketType): Promise<TicketType> {
    const [row] = await this.db
      .insert(ticketType)
      .values({
        id: entity.id,
        eventId: entity.eventId,
        name: entity.name,
        tierCode: entity.tierCode,
        price: entity.price.toFixed(2),
        currency: entity.currency,
        stock: entity.stock,
        sold: entity.sold,
        maxPerUser: entity.maxPerUser,
        status: entity.status,
      })
      .returning({ id: ticketType.id });
    if (!row) throw new Error('No se pudo crear el tipo de entrada');
    const created = await this.findById(row.id);
    if (!created) throw new Error('No se pudo recargar el tipo de entrada');
    return created;
  }

  async update(entity: TicketType): Promise<TicketType> {
    const [row] = await this.db
      .update(ticketType)
      .set({ status: entity.status, sold: entity.sold })
      .where(eq(ticketType.id, entity.id))
      .returning({ id: ticketType.id });
    if (!row) throw new Error('No se pudo actualizar el tipo de entrada');
    const updated = await this.findById(row.id);
    if (!updated) throw new Error('No se pudo recargar el tipo de entrada');
    return updated;
  }

  private selection() {
    const activeHolds = activeTicketHoldQuantitySql(ticketType.id);
    return {
      ...getTableColumns(ticketType),
      available: availableCapacitySql(
        ticketType.stock,
        ticketType.sold,
        activeHolds,
      ),
    };
  }

  private toDomain(row: RowWithAvailability): TicketType {
    return TicketType.fromPersistence({
      id: row.id,
      eventId: row.eventId,
      name: row.name,
      tierCode: row.tierCode as TicketTier,
      price: Number(row.price),
      currency: row.currency,
      stock: row.stock,
      sold: row.sold,
      available: Number(row.available),
      maxPerUser: row.maxPerUser,
      saleStartsAt: row.saleStartsAt,
      saleEndsAt: row.saleEndsAt,
      status: row.status as TicketTypeStatus,
      createdAt: row.createdAt,
    });
  }
}
