import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import type { LocalOrderSplit } from '../../domain/entities/local-order-split.entity';
import { LocalOrderSplit as Split } from '../../domain/entities/local-order-split.entity';
import {
  LocalOrderAlreadyPaidError,
  LocalOrderNotFoundError,
} from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';
import {
  LOCAL_ORDER_SPLIT_REPOSITORY,
  type LocalOrderSplitRepository,
} from '../../domain/ports/local-order-split.repository';

@Injectable()
export class CreateLocalOrderSplitUseCase {
  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(LOCAL_ORDER_SPLIT_REPOSITORY)
    private readonly splits: LocalOrderSplitRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    orderId: string;
    userId: string;
    now?: Date;
  }): Promise<LocalOrderSplit> {
    return this.uow.run(async (tx) => {
      const order = await this.orders.findMine(input.orderId, input.userId, tx);
      if (!order) throw new LocalOrderNotFoundError();
      if (order.paymentStatus === 'paid') throw new LocalOrderAlreadyPaidError();
      const existing = await this.splits.findByOrderId(order.id, tx);
      if (existing) return existing;
      const now = input.now ?? new Date();
      const split = Split.create({
        id: randomUUID(),
        orderId: order.id,
        shareToken: randomBytes(24).toString('base64url'),
        expectedTotal: order.totalAmount,
        createdAt: now,
        updatedAt: now,
      });
      return this.splits.create(split, tx);
    });
  }
}
