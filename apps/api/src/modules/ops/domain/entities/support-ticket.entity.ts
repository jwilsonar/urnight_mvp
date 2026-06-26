export type SupportCategory = 'incident' | 'request' | 'bug';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'medium' | 'high';

export interface SupportTicketProps {
  id: string;
  ticketCode: string;
  openedBy: string | null;
  localId: string | null;
  subject: string;
  description: string | null;
  category: SupportCategory;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: Date;
}

/** Ticket de soporte interno (§4.1). */
export class SupportTicket {
  private constructor(private readonly props: SupportTicketProps) {}

  static open(input: {
    id: string;
    ticketCode: string;
    openedBy: string | null;
    localId?: string | null;
    subject: string;
    description?: string | null;
    category: SupportCategory;
    priority: SupportPriority;
  }): SupportTicket {
    return new SupportTicket({
      id: input.id,
      ticketCode: input.ticketCode,
      openedBy: input.openedBy,
      localId: input.localId ?? null,
      subject: input.subject.trim(),
      description: input.description ?? null,
      category: input.category,
      status: 'open',
      priority: input.priority,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: SupportTicketProps): SupportTicket {
    return new SupportTicket(props);
  }

  changeStatus(status: SupportStatus): void {
    this.props.status = status;
  }

  get id(): string {
    return this.props.id;
  }
  get ticketCode(): string {
    return this.props.ticketCode;
  }
  get openedBy(): string | null {
    return this.props.openedBy;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get subject(): string {
    return this.props.subject;
  }
  get description(): string | null {
    return this.props.description;
  }
  get category(): SupportCategory {
    return this.props.category;
  }
  get status(): SupportStatus {
    return this.props.status;
  }
  get priority(): SupportPriority {
    return this.props.priority;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
