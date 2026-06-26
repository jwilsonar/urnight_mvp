import { Inject, Injectable } from '@nestjs/common';
import type { Order } from '../../domain/entities/order.entity';
import { OrderNotFoundError } from '../../domain/errors/checkout.errors';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/ports/order.repository';

/** Caso de uso: detalle de orden propia. */
@Injectable()
export class GetOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: { orderId: string; userId: string }): Promise<Order> {
    const order = await this.orders.findById(input.orderId);
    if (!order || order.userId !== input.userId) throw new OrderNotFoundError();
    return order;
  }
}
