import { AttendeeUnderageError } from '../errors/checkout.errors';

export type DocumentType = 'dni' | 'ce' | 'passport';
const MIN_AGE = 18;

export interface AttendeeProps {
  id: string;
  ticketId: string;
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: Date;
  isBuyer: boolean;
}

/** Asistente de una entrada (§4.1). Invariante de dominio: 18+ (§4.3). */
export class Attendee {
  private constructor(private readonly props: AttendeeProps) {}

  static create(input: {
    id: string;
    ticketId: string;
    fullName: string;
    documentType: DocumentType;
    documentNumber: string;
    birthDate: Date;
    isBuyer: boolean;
  }): Attendee {
    if (!Attendee.isAdult(input.birthDate)) throw new AttendeeUnderageError();
    return new Attendee({ ...input, fullName: input.fullName.trim() });
  }

  /** Reconstruye desde persistencia (sin revalidar 18+: ya se validó al crear). */
  static fromPersistence(props: AttendeeProps): Attendee {
    return new Attendee(props);
  }

  private static isAdult(birthDate: Date, now: Date = new Date()): boolean {
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
    return age >= MIN_AGE;
  }

  get id(): string {
    return this.props.id;
  }
  get ticketId(): string {
    return this.props.ticketId;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get documentType(): DocumentType {
    return this.props.documentType;
  }
  get documentNumber(): string {
    return this.props.documentNumber;
  }
  get birthDate(): Date {
    return this.props.birthDate;
  }
  get isBuyer(): boolean {
    return this.props.isBuyer;
  }
}
