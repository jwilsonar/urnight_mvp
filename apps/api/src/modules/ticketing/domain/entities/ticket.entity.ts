export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'expired';
export type ValidationResult = 'valid' | 'already_used' | 'cancelled' | 'invalid';

export interface TicketProps {
  id: string;
  orderItemId: string;
  eventId: string;
  ticketTypeId: string;
  qrCode: string;
  qrImageKey: string | null;
  status: TicketStatus;
  pdfUrl: string | null;
  issuedAt: Date;
  usedAt: Date | null;
}

/** Aggregate Ticket (§4.1). QR único e impredecible (UNIQUE + token aleatorio). */
export class Ticket {
  private constructor(private readonly props: TicketProps) {}

  static issue(input: {
    id: string;
    orderItemId: string;
    eventId: string;
    ticketTypeId: string;
    qrCode: string;
  }): Ticket {
    return new Ticket({
      id: input.id,
      orderItemId: input.orderItemId,
      eventId: input.eventId,
      ticketTypeId: input.ticketTypeId,
      qrCode: input.qrCode,
      qrImageKey: null,
      status: 'valid',
      pdfUrl: null,
      issuedAt: new Date(),
      usedAt: null,
    });
  }

  static fromPersistence(props: TicketProps): Ticket {
    return new Ticket(props);
  }

  /** Resultado de validar en puerta (no muta; markUsed lo hace el caso de uso). */
  validate(): ValidationResult {
    switch (this.props.status) {
      case 'valid':
        return 'valid';
      case 'used':
        return 'already_used';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'invalid';
    }
  }

  markUsed(at: Date = new Date()): void {
    this.props.status = 'used';
    this.props.usedAt = at;
  }

  /** Asocia la key S3 del PNG del QR (generado tras la emisión). */
  attachQrImage(key: string): void {
    this.props.qrImageKey = key;
  }

  get id(): string {
    return this.props.id;
  }
  get orderItemId(): string {
    return this.props.orderItemId;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get ticketTypeId(): string {
    return this.props.ticketTypeId;
  }
  get qrCode(): string {
    return this.props.qrCode;
  }
  get qrImageKey(): string | null {
    return this.props.qrImageKey;
  }
  get status(): TicketStatus {
    return this.props.status;
  }
  get issuedAt(): Date {
    return this.props.issuedAt;
  }
}
