import type { Attendee } from '../../../../modules/ticketing/domain/entities/attendee.entity';
import { AttendeeBuilder, type AttendeeProps } from '../../builders/ticketing/attendee.builder';

/** Casos predefinidos de Attendee (invariante 18+). */
export const AttendeeMother = {
  /** Asistente adulto válido. */
  adult: (): Attendee => new AttendeeBuilder().asAdult().build(),
  /** Asistente que además es el comprador. */
  buyer: (): Attendee => new AttendeeBuilder().asAdult().asBuyer().build(),
  /** Input crudo de un menor (espera throw en `Attendee.create`). */
  minorProps: (): AttendeeProps => new AttendeeBuilder().asMinor().buildProps(),
};
