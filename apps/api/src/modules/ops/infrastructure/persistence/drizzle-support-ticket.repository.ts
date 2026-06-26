import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { supportTicket } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import {
  SupportTicket,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
} from '../../domain/entities/support-ticket.entity';
import type { SupportTicketRepository } from '../../domain/ports/ops.ports';

type Row = typeof supportTicket.$inferSelect;

@Injectable()
export class DrizzleSupportTicketRepository implements SupportTicketRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(entity: SupportTicket): Promise<SupportTicket> {
    const [row] = await this.db
      .insert(supportTicket)
      .values({
        id: entity.id,
        ticketCode: entity.ticketCode,
        openedBy: entity.openedBy,
        localId: entity.localId,
        subject: entity.subject,
        description: entity.description,
        category: entity.category,
        status: entity.status,
        priority: entity.priority,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el ticket');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<SupportTicket | null> {
    const [row] = await this.db.select().from(supportTicket).where(eq(supportTicket.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async update(entity: SupportTicket): Promise<SupportTicket> {
    const [row] = await this.db
      .update(supportTicket)
      .set({ status: entity.status, updatedAt: new Date() })
      .where(eq(supportTicket.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el ticket');
    return this.toDomain(row);
  }

  private toDomain(row: Row): SupportTicket {
    return SupportTicket.fromPersistence({
      id: row.id,
      ticketCode: row.ticketCode,
      openedBy: row.openedBy,
      localId: row.localId,
      subject: row.subject,
      description: row.description,
      category: row.category as SupportCategory,
      status: row.status as SupportStatus,
      priority: row.priority as SupportPriority,
      createdAt: row.createdAt,
    });
  }
}
