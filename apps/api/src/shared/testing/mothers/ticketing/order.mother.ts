import type { Order } from '../../../../modules/ticketing/domain/entities/order.entity';
import { OrderBuilder } from '../../builders/ticketing/order.builder';

/** Casos predefinidos de Order. */
export const OrderMother = {
  /** Orden pendiente (2 entradas a 50). subtotal=100, total=100. */
  pending: (): Order => new OrderBuilder().build(),
  /** Orden ya pagada. */
  paid: (): Order => {
    const order = new OrderBuilder().build();
    order.confirmPayment(new Date('2026-06-20T00:00:00Z'));
    return order;
  },
  /** Orden con varias líneas (subtotal=130.5). */
  multiItem: (): Order =>
    new OrderBuilder()
      .withItems([
        { id: 'item-1', ticketTypeId: 'tt-1', quantity: 2, unitPrice: 50 },
        { id: 'item-2', ticketTypeId: 'tt-2', quantity: 1, unitPrice: 30.5 },
      ])
      .build(),
};
