export type TicketHoldStatus = 'active' | 'converted' | 'expired' | 'released';

export interface TicketHoldProps {
  id: string;
  eventId: string;
  ticketTypeId: string;
  orderId: string | null;
  userId: string;
  quantity: number;
  status: TicketHoldStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Reserva temporal de cupos de un tipo de entrada. */
export class TicketHold {
  private constructor(private readonly props: TicketHoldProps) {}

  static create(input: {
    id: string;
    eventId: string;
    ticketTypeId: string;
    userId: string;
    quantity: number;
    expiresAt: Date;
    now?: Date;
  }): TicketHold {
    const now = input.now ?? new Date();
    return new TicketHold({
      id: input.id,
      eventId: input.eventId,
      ticketTypeId: input.ticketTypeId,
      orderId: null,
      userId: input.userId,
      quantity: input.quantity,
      status: 'active',
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: TicketHoldProps): TicketHold {
    return new TicketHold(props);
  }

  isActive(at = new Date()): boolean {
    return this.props.status === 'active' && this.props.expiresAt > at;
  }

  /**
   * Devuelve true solo en la primera conversión. Repetir la misma confirmación
   * de pago es un no-op; otra orden no puede apropiarse del hold.
   */
  convert(orderId: string, at = new Date()): boolean {
    if (this.props.status === 'converted') {
      return this.props.orderId === orderId ? false : false;
    }
    if (!this.isActive(at)) return false;
    this.props.status = 'converted';
    this.props.orderId = orderId;
    this.props.updatedAt = at;
    return true;
  }

  release(at = new Date()): void {
    if (this.props.status !== 'active') return;
    this.props.status = this.props.expiresAt <= at ? 'expired' : 'released';
    this.props.updatedAt = at;
  }

  expire(at = new Date()): void {
    if (this.props.status !== 'active' || this.props.expiresAt > at) return;
    this.props.status = 'expired';
    this.props.updatedAt = at;
  }

  get id(): string {
    return this.props.id;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get ticketTypeId(): string {
    return this.props.ticketTypeId;
  }
  get orderId(): string | null {
    return this.props.orderId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get status(): TicketHoldStatus {
    return this.props.status;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
