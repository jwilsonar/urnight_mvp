import type { AttendeeInput, CreateOrderDto, OrderItemInput } from '@urnight/contracts';
import { yearsAgo } from './attendee.builder';

const adultBirthDate = (): string => yearsAgo(25).toISOString().slice(0, 10);

/** Asistente de DTO por defecto (mayor de edad, comprador). */
export function attendeeDto(overrides: Partial<AttendeeInput> = {}): AttendeeInput {
  return {
    fullName: 'Ada Lovelace',
    documentType: 'dni',
    documentNumber: '12345678',
    birthDate: adultBirthDate(),
    isBuyer: false,
    ...overrides,
  };
}

/**
 * Builder fluido para el DTO de checkout (`CreateOrderDto`). Una línea por
 * tipo de entrada; la cantidad = nº de asistentes (invariante del contrato).
 */
export class CreateOrderDtoBuilder {
  private eventId = '11111111-1111-1111-1111-111111111111';
  private method: CreateOrderDto['method'] = 'card';
  private items: OrderItemInput[] = [
    { ticketTypeId: '22222222-2222-2222-2222-222222222222', attendees: [attendeeDto({ isBuyer: true })] },
  ];
  private referralCode: string | undefined = undefined;
  private promoCode: string | undefined = undefined;

  withEvent(eventId: string): this {
    this.eventId = eventId;
    return this;
  }

  withMethod(method: CreateOrderDto['method']): this {
    this.method = method;
    return this;
  }

  withItems(items: OrderItemInput[]): this {
    this.items = items;
    return this;
  }

  /** Atajo: una sola línea con `ticketTypeId` y los asistentes dados. */
  withSingleItem(ticketTypeId: string, attendees: AttendeeInput[]): this {
    this.items = [{ ticketTypeId, attendees }];
    return this;
  }

  withReferralCode(referralCode: string): this {
    this.referralCode = referralCode;
    return this;
  }

  withPromoCode(promoCode: string): this {
    this.promoCode = promoCode;
    return this;
  }

  build(): CreateOrderDto {
    return {
      eventId: this.eventId,
      method: this.method,
      items: this.items,
      ...(this.referralCode !== undefined ? { referralCode: this.referralCode } : {}),
      ...(this.promoCode !== undefined ? { promoCode: this.promoCode } : {}),
    };
  }
}
