import { randomUUID } from 'node:crypto';
import {
  Attendee,
  type DocumentType,
} from '../../../../modules/ticketing/domain/entities/attendee.entity';

/** Fecha de nacimiento a `years` años atrás desde hoy. */
export function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export interface AttendeeProps {
  id: string;
  ticketId: string;
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: Date;
  isBuyer: boolean;
}

/**
 * Builder fluido para Attendee. `buildProps()` devuelve el input crudo (sin
 * validar) para los tests que esperan que `create` lance (p.ej. menor de edad).
 */
export class AttendeeBuilder {
  private id: string = randomUUID();
  private ticketId = 'ticket-1';
  private fullName = 'Ada Lovelace';
  private documentType: DocumentType = 'dni';
  private documentNumber = '12345678';
  private birthDate: Date = yearsAgo(25);
  private isBuyer = false;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTicket(ticketId: string): this {
    this.ticketId = ticketId;
    return this;
  }

  withFullName(fullName: string): this {
    this.fullName = fullName;
    return this;
  }

  withDocumentType(documentType: DocumentType): this {
    this.documentType = documentType;
    return this;
  }

  withDocumentNumber(documentNumber: string): this {
    this.documentNumber = documentNumber;
    return this;
  }

  withBirthDate(birthDate: Date): this {
    this.birthDate = birthDate;
    return this;
  }

  asBuyer(): this {
    this.isBuyer = true;
    return this;
  }

  asAdult(age = 25): this {
    this.birthDate = yearsAgo(age);
    return this;
  }

  asMinor(age = 16): this {
    this.birthDate = yearsAgo(age);
    return this;
  }

  /** Input crudo, sin validar — para tests que esperan que `create` lance. */
  buildProps(): AttendeeProps {
    return {
      id: this.id,
      ticketId: this.ticketId,
      fullName: this.fullName,
      documentType: this.documentType,
      documentNumber: this.documentNumber,
      birthDate: this.birthDate,
      isBuyer: this.isBuyer,
    };
  }

  build(): Attendee {
    return Attendee.create(this.buildProps());
  }
}
