import { randomUUID } from 'node:crypto';
import {
  SupportTicket,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
} from '../../../../modules/ops/domain/entities/support-ticket.entity';

/** Builder fluido para SupportTicket (delegando en `SupportTicket.fromPersistence`). */
export class SupportTicketBuilder {
  private id: string = randomUUID();
  private ticketCode = 'SUP-ABC123';
  private openedBy: string | null = 'user-1';
  private localId: string | null = null;
  private subject = 'No puedo validar mi QR';
  private description: string | null = null;
  private category: SupportCategory = 'incident';
  private status: SupportStatus = 'open';
  private priority: SupportPriority = 'low';
  private createdAt = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTicketCode(ticketCode: string): this {
    this.ticketCode = ticketCode;
    return this;
  }

  withOpenedBy(openedBy: string | null): this {
    this.openedBy = openedBy;
    return this;
  }

  withLocalId(localId: string | null): this {
    this.localId = localId;
    return this;
  }

  withSubject(subject: string): this {
    this.subject = subject;
    return this;
  }

  withDescription(description: string | null): this {
    this.description = description;
    return this;
  }

  withCategory(category: SupportCategory): this {
    this.category = category;
    return this;
  }

  withStatus(status: SupportStatus): this {
    this.status = status;
    return this;
  }

  withPriority(priority: SupportPriority): this {
    this.priority = priority;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): SupportTicket {
    return SupportTicket.fromPersistence({
      id: this.id,
      ticketCode: this.ticketCode,
      openedBy: this.openedBy,
      localId: this.localId,
      subject: this.subject,
      description: this.description,
      category: this.category,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
    });
  }
}
