import { describe, expect, it } from 'vitest';
import { OrderBuilder } from '../../../../shared/testing/builders/ticketing';
import { OrderItem } from './order.entity';

describe('OrderItem (snapshot de precio)', () => {
  it('calcula lineTotal = unitPrice * quantity (redondeado a 2)', () => {
    const item = OrderItem.create({ id: 'i', ticketTypeId: 't', quantity: 3, unitPrice: 30.5 });
    expect(item.lineTotal).toBe(91.5);
    expect(item.unitPrice).toBe(30.5);
    expect(item.quantity).toBe(3);
  });

  it('redondea a 2 decimales montos con coma flotante', () => {
    const item = OrderItem.create({ id: 'i', ticketTypeId: 't', quantity: 3, unitPrice: 10.333 });
    expect(item.lineTotal).toBe(31); // 30.999 → 31.00
  });
});

describe('Order (totales + snapshot de comisión)', () => {
  it('suma líneas en subtotal y aplica la comisión como snapshot', () => {
    const order = new OrderBuilder()
      .withCommissionRate(0.12)
      .withItems([
        { id: 'i1', ticketTypeId: 't1', quantity: 2, unitPrice: 50 },
        { id: 'i2', ticketTypeId: 't2', quantity: 1, unitPrice: 30.5 },
      ])
      .build();
    expect(order.subtotal).toBe(130.5);
    expect(order.commissionAmount).toBe(15.66); // 130.5 * 0.12
    expect(order.total).toBe(130.5);
    expect(order.totalQuantity()).toBe(3);
  });

  it('aplica descuento y nunca deja el total por debajo de 0', () => {
    const order = new OrderBuilder()
      .withItems([{ id: 'i1', ticketTypeId: 't1', quantity: 1, unitPrice: 40 }])
      .build();
    order.applyDiscount(100);
    expect(order.total).toBe(0);
  });

  it('isPayable solo en estado pending', () => {
    const order = new OrderBuilder().build();
    expect(order.isPayable()).toBe(true);
    order.confirmPayment();
    expect(order.isPayable()).toBe(false);
  });

  it('fail marca la orden como fallida', () => {
    const order = new OrderBuilder().build();
    order.fail();
    expect(order.status).toBe('failed');
  });
});
