import { describe, expect, it } from 'vitest';
import { Order } from './order.entity';

describe('Order (aggregate)', () => {
  const base = {
    id: 'o1',
    orderCode: 'ORD-1',
    userId: 'u1',
    eventId: 'e1',
    currency: 'PEN',
    commissionRate: 0.1,
    items: [
      { id: 'i1', ticketTypeId: 't1', quantity: 2, unitPrice: 50 },
      { id: 'i2', ticketTypeId: 't2', quantity: 1, unitPrice: 30.5 },
    ],
  };

  it('calcula subtotal, comisión y total (snapshot)', () => {
    const order = Order.create(base);
    expect(order.subtotal).toBe(130.5); // 2*50 + 1*30.5
    expect(order.commissionAmount).toBe(13.05); // 10%
    expect(order.total).toBe(130.5); // sin descuento
    expect(order.totalQuantity()).toBe(3);
    expect(order.status).toBe('pending');
  });

  it('confirmPayment marca pagada con fecha', () => {
    const order = Order.create(base);
    order.confirmPayment(new Date('2026-06-19T00:00:00Z'));
    expect(order.status).toBe('paid');
    expect(order.paidAt).not.toBeNull();
  });

  it('aplica descuento al total', () => {
    const order = Order.create(base);
    order.applyDiscount(30.5);
    expect(order.total).toBe(100);
  });
});
