import { Inject, Injectable } from '@nestjs/common';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import { LocalOrderNotFoundError } from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';

@Injectable()
export class GetMyLocalOrderUseCase {
  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
  ) {}

  async execute(input: { orderId: string; userId: string }): Promise<LocalOrder> {
    const order = await this.orders.findMine(input.orderId, input.userId);
    if (!order) throw new LocalOrderNotFoundError();
    return order;
  }
}
