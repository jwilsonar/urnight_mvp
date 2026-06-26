import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { event, order, orderItem, ticket } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { AttendanceContext, AttendancePort } from '../../domain/ports/review.repository';

/**
 * Adapter de elegibilidad (acoplamiento a nivel de persistencia con ticketing).
 * Confirma que el usuario tiene una entrada USADA y devuelve su evento/local.
 */
@Injectable()
export class DrizzleAttendanceAdapter implements AttendancePort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async getUsedTicketContext(userId: string, ticketId: string): Promise<AttendanceContext | null> {
    const [row] = await this.db
      .select({ eventId: event.id, localId: event.localId })
      .from(ticket)
      .innerJoin(orderItem, eq(orderItem.id, ticket.orderItemId))
      .innerJoin(order, eq(order.id, orderItem.orderId))
      .innerJoin(event, eq(event.id, ticket.eventId))
      .where(and(eq(ticket.id, ticketId), eq(order.userId, userId), eq(ticket.status, 'used')))
      .limit(1);
    return row ? { eventId: row.eventId, localId: row.localId } : null;
  }
}
