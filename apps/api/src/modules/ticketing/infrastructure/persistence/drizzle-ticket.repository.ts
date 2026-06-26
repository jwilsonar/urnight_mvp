import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { attendee, event, local, order, orderItem, ticket, ticketType } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { Ticket, type TicketStatus } from '../../domain/entities/ticket.entity';
import type {
  IssuedTicket,
  TicketRepository,
  UserTicket,
} from '../../domain/ports/ticket.repository';

type Row = typeof ticket.$inferSelect;

@Injectable()
export class DrizzleTicketRepository implements TicketRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async issueMany(entries: IssuedTicket[], tx: unknown): Promise<void> {
    if (entries.length === 0) return;
    const db = this.exec(tx);
    await db.insert(ticket).values(
      entries.map((e) => ({
        id: e.ticket.id,
        orderItemId: e.ticket.orderItemId,
        eventId: e.ticket.eventId,
        ticketTypeId: e.ticket.ticketTypeId,
        qrCode: e.ticket.qrCode,
        status: e.ticket.status,
      })),
    );
    await db.insert(attendee).values(
      entries.map((e) => ({
        id: e.attendee.id,
        ticketId: e.attendee.ticketId,
        fullName: e.attendee.fullName,
        documentType: e.attendee.documentType,
        documentNumber: e.attendee.documentNumber,
        birthDate: e.attendee.birthDate.toISOString().slice(0, 10),
        isBuyer: e.attendee.isBuyer,
      })),
    );
  }

  async findByQr(qrCode: string): Promise<Ticket | null> {
    const [row] = await this.db.select().from(ticket).where(eq(ticket.qrCode, qrCode)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async listByUser(userId: string): Promise<UserTicket[]> {
    const rows = await this.db
      .select({
        t: ticket,
        attendeeName: attendee.fullName,
        eventName: event.name,
        eventStartsAt: event.startsAt,
        eventFlyerKey: event.flyerUrl,
        venueName: local.name,
        ticketTypeName: ticketType.name,
      })
      .from(ticket)
      .innerJoin(orderItem, eq(orderItem.id, ticket.orderItemId))
      .innerJoin(order, eq(order.id, orderItem.orderId))
      .innerJoin(event, eq(event.id, ticket.eventId))
      .innerJoin(ticketType, eq(ticketType.id, ticket.ticketTypeId))
      .leftJoin(local, eq(local.id, event.localId))
      .leftJoin(attendee, eq(attendee.ticketId, ticket.id))
      .where(eq(order.userId, userId))
      .orderBy(event.startsAt);
    return rows.map((r) => ({
      ticket: this.toDomain(r.t),
      attendeeName: r.attendeeName ?? '',
      detail: {
        eventName: r.eventName,
        eventStartsAt: r.eventStartsAt,
        eventFlyerKey: r.eventFlyerKey,
        venueName: r.venueName,
        ticketTypeName: r.ticketTypeName,
      },
    }));
  }

  async update(entity: Ticket, tx?: unknown): Promise<void> {
    await this.exec(tx)
      .update(ticket)
      .set({ status: entity.status, usedAt: entity.status === 'used' ? new Date() : null })
      .where(eq(ticket.id, entity.id));
  }

  async attachQrImage(ticketId: string, key: string): Promise<void> {
    await this.db.update(ticket).set({ qrImageKey: key }).where(eq(ticket.id, ticketId));
  }

  private toDomain(row: Row): Ticket {
    return Ticket.fromPersistence({
      id: row.id,
      orderItemId: row.orderItemId,
      eventId: row.eventId,
      ticketTypeId: row.ticketTypeId,
      qrCode: row.qrCode,
      qrImageKey: row.qrImageKey,
      status: row.status as TicketStatus,
      pdfUrl: row.pdfUrl,
      issuedAt: row.issuedAt,
      usedAt: row.usedAt,
    });
  }
}
