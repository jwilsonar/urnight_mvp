import { describe, expect, it } from 'vitest';
import type {
  PromoterAnalyticsFacts,
  PromoterAttributionFact,
  PromoterTicketFact,
} from '../../domain/ports/promoter-analytics.repository';
import { calculatePromoterMetrics } from './promoter-metrics.calculator';

const EVENT = '11111111-1111-1111-1111-111111111111';
const PROMOTER = '22222222-2222-2222-2222-222222222222';

function attribution(
  patch: Partial<PromoterAttributionFact> = {},
): PromoterAttributionFact {
  return {
    promoterId: PROMOTER,
    eventId: EVENT,
    eventName: 'Noche de prueba',
    eventStartsAt: new Date('2026-08-01T03:00:00.000Z'),
    eventStatus: 'finished',
    orderId: '33333333-3333-3333-3333-333333333333',
    orderStatus: 'paid',
    orderTotal: 100,
    currency: 'PEN',
    source: 'promo_code',
    code: 'ANA10',
    attributedAt: new Date('2026-07-01T12:00:00.000Z'),
    commissionAmount: null,
    commissionStatus: null,
    ...patch,
  };
}

function ticket(patch: Partial<PromoterTicketFact> = {}): PromoterTicketFact {
  return {
    orderId: '33333333-3333-3333-3333-333333333333',
    ticketId: '44444444-4444-4444-4444-444444444444',
    status: 'valid',
    usedAt: null,
    isBuyer: true,
    ...patch,
  };
}

function facts(
  patch: Partial<PromoterAnalyticsFacts> = {},
): PromoterAnalyticsFacts {
  return {
    assignments: [
      {
        promoterId: PROMOTER,
        eventId: EVENT,
        eventName: 'Noche de prueba',
        eventStartsAt: new Date('2026-08-01T03:00:00.000Z'),
        eventStatus: 'finished',
      },
    ],
    attributions: [],
    tickets: [],
    ...patch,
  };
}

describe('calculatePromoterMetrics', () => {
  it('devuelve ceros, no NaN, cuando la lista está vacía', () => {
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts(),
    );

    expect(result.totals.registeredCount).toBe(0);
    expect(result.totals.attendedCount).toBe(0);
    expect(result.totals.attendanceRate).toBe(0);
    expect(Number.isNaN(result.totals.attendanceRate)).toBe(false);
  });

  it('cuenta en lista a quien tiene ticket vigente, pero no como asistencia si nunca entró', () => {
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({ attributions: [attribution()], tickets: [ticket()] }),
    );

    expect(result.totals.registeredCount).toBe(1);
    expect(result.totals.attendedCount).toBe(0);
    expect(result.totals.attendanceRate).toBe(0);
  });

  it('deduplica el mismo ticket para que una doble validación no infle asistencia', () => {
    const entered = ticket({
      status: 'used',
      usedAt: new Date('2026-08-01T04:30:00.000Z'),
    });
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        attributions: [attribution()],
        tickets: [entered, { ...entered }],
      }),
    );

    expect(result.totals.registeredCount).toBe(1);
    expect(result.totals.attendedCount).toBe(1);
    expect(result.totals.attendanceRate).toBe(100);
  });

  it('deduplica acompañantes por ticket y solo calcula órdenes con un comprador', () => {
    const companion = ticket({
      ticketId: '55555555-5555-5555-5555-555555555555',
      isBuyer: false,
    });
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        attributions: [attribution()],
        tickets: [ticket(), companion, { ...companion }],
      }),
    );

    expect(result.totals.companionsCount).toBe(1);
    expect(result.totals.companionOrdersKnown).toBe(1);
    expect(result.totals.companionOrdersUnknown).toBe(0);
  });

  it('expone el código e importe de cada venta sin duplicar promo + referral', () => {
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        attributions: [
          attribution(),
          attribution({
            source: 'referral',
            code: null,
            commissionAmount: 7.5,
            commissionStatus: 'estimated',
          }),
        ],
        tickets: [ticket()],
      }),
    );

    expect(result.events[0]?.sales).toEqual([
      {
        orderId: '33333333-3333-3333-3333-333333333333',
        code: 'ANA10',
        source: 'promo_and_referral',
        ticketCount: 1,
        amount: 100,
        currency: 'PEN',
        commissionAmount: 7.5,
        attributedAt: new Date('2026-07-01T12:00:00.000Z'),
      },
    ]);
    expect(result.events[0]?.attributedOrdersCount).toBe(1);
  });

  it('marca acompañantes como desconocidos si no hay exactamente un comprador', () => {
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        attributions: [attribution()],
        tickets: [
          ticket({ isBuyer: false }),
          ticket({
            ticketId: '55555555-5555-5555-5555-555555555555',
            isBuyer: false,
          }),
        ],
      }),
    );

    expect(result.totals.companionsCount).toBe(0);
    expect(result.totals.companionOrdersKnown).toBe(0);
    expect(result.totals.companionOrdersUnknown).toBe(1);
  });

  it('muestra el evento cancelado, pero excluye sus números de los totales', () => {
    const cancelled = attribution({ eventStatus: 'cancelled' });
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        assignments: [{ ...facts().assignments[0]!, eventStatus: 'cancelled' }],
        attributions: [cancelled],
        tickets: [
          ticket({
            status: 'used',
            usedAt: new Date('2026-08-01T04:30:00.000Z'),
          }),
        ],
      }),
    );

    expect(result.events[0]?.excludedReason).toBe('event_cancelled');
    expect(result.events[0]?.registeredCount).toBe(0);
    expect(result.totals.registeredCount).toBe(0);
    expect(result.totals.salesCount).toBe(0);
  });

  it('excluye una orden con atribuciones de promotores distintos en vez de inventar precedencia', () => {
    const result = calculatePromoterMetrics(
      { id: PROMOTER, name: 'Ana', companyId: 'company-1' },
      facts({
        attributions: [
          attribution(),
          attribution({
            promoterId: '66666666-6666-6666-6666-666666666666',
            source: 'referral',
            code: 'OTRO',
            commissionAmount: 10,
            commissionStatus: 'estimated',
          }),
        ],
        tickets: [ticket()],
      }),
    );

    expect(result.totals.registeredCount).toBe(0);
    expect(result.totals.salesCount).toBe(0);
    expect(result.totals.conflictingOrdersExcluded).toBe(1);
  });
});
