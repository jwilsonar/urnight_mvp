import type { CreateOrderDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { keyForSubmission, sameOrderShape, type CheckoutDraft } from './checkout-draft-rules';

const EVENT = '11111111-1111-1111-1111-111111111111';
const TYPE_A = '22222222-2222-2222-2222-222222222222';
const TYPE_B = '33333333-3333-3333-3333-333333333333';

function dto(ticketTypeId: string, attendees: number): CreateOrderDto {
  return {
    eventId: EVENT,
    items: [
      {
        ticketTypeId,
        attendees: Array.from({ length: attendees }, (_, i) => ({
          fullName: `Asistente ${i}`,
          documentType: 'dni' as const,
          documentNumber: `1234567${i}`,
          birthDate: '1995-01-01',
          isBuyer: i === 0,
        })),
      },
    ],
    method: 'card' as const,
  };
}

function draft(dtoValue: CreateOrderDto, key = 'key-vieja'): CheckoutDraft {
  return {
    eventId: EVENT,
    idempotencyKey: key,
    dto: dtoValue,
    status: 'sent',
    createdAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('sameOrderShape', () => {
  it('reconoce dos pedidos idénticos', () => {
    expect(sameOrderShape(dto(TYPE_A, 2), dto(TYPE_A, 2))).toBe(true);
  });

  it('distingue un cambio de tramo', () => {
    expect(sameOrderShape(dto(TYPE_A, 2), dto(TYPE_B, 2))).toBe(false);
  });

  it('distingue un cambio de cantidad', () => {
    expect(sameOrderShape(dto(TYPE_A, 2), dto(TYPE_A, 3))).toBe(false);
  });

  it('distingue un cambio de método de pago', () => {
    expect(sameOrderShape(dto(TYPE_A, 2), { ...dto(TYPE_A, 2), method: 'yape' })).toBe(false);
  });

  it('ignora el holdId: rotar la reserva no cambia la compra', () => {
    const base = dto(TYPE_A, 2);
    const withHold: CreateOrderDto = {
      ...base,
      items: base.items.map((item) => ({
        ...item,
        holdId: '44444444-4444-4444-4444-444444444444',
      })),
    };
    expect(sameOrderShape(base, withHold)).toBe(true);
  });
});

describe('keyForSubmission', () => {
  it('reutiliza la clave si el pedido no cambió: reintentar no debe cobrar dos veces', () => {
    const same = dto(TYPE_A, 2);
    expect(keyForSubmission(draft(same), same, 'key-nueva')).toBe('key-vieja');
  });

  it('usa una clave nueva si el pedido cambió', () => {
    expect(keyForSubmission(draft(dto(TYPE_A, 2)), dto(TYPE_B, 2), 'key-nueva')).toBe('key-nueva');
  });

  it('usa una clave nueva si no había borrador', () => {
    expect(keyForSubmission(null, dto(TYPE_A, 2), 'key-nueva')).toBe('key-nueva');
  });
});
