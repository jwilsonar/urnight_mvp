import { describe, expect, it } from 'vitest';
import { OrderBuilder } from '../../../../shared/testing/builders/ticketing';
import { InMemoryOrderRepository } from '../../../../shared/testing/in-memory/ticketing';
import { OrderNotFoundError } from '../../domain/errors/checkout.errors';
import { GetOrderUseCase } from './get-order.use-case';

function build() {
  const orders = new InMemoryOrderRepository();
  const useCase = new GetOrderUseCase(orders);
  return { useCase, orders };
}

describe('GetOrderUseCase', () => {
  it('devuelve la orden propia del usuario', async () => {
    const { useCase, orders } = build();
    const order = new OrderBuilder().withId('o1').withUser('user-1').build();
    await orders.create(order);

    const result = await useCase.execute({ orderId: 'o1', userId: 'user-1' });
    expect(result.id).toBe('o1');
  });

  it('lanza OrderNotFoundError si la orden no existe', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ orderId: 'nope', userId: 'user-1' })).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });

  it('lanza OrderNotFoundError si la orden es de otro usuario (no filtra existencia)', async () => {
    const { useCase, orders } = build();
    await orders.create(new OrderBuilder().withId('o1').withUser('owner').build());
    await expect(useCase.execute({ orderId: 'o1', userId: 'intruso' })).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });
});
