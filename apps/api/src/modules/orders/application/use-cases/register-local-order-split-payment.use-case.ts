import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegisterLocalOrderSplitPaymentDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import {
  LocalOrderSplitPayment,
  type LocalOrderSplit,
} from '../../domain/entities/local-order-split.entity';
import {
  LocalOrderAlreadyPaidError,
  LocalOrderNotFoundError,
  LocalOrderSplitNotFoundError,
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
export class RegisterLocalOrderSplitPaymentUseCase {
  private readonly log = createLogger(RegisterLocalOrderSplitPaymentUseCase.name);

  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(LOCAL_ORDER_SPLIT_REPOSITORY)
    private readonly splits: LocalOrderSplitRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    shareToken: string;
    dto: RegisterLocalOrderSplitPaymentDto;
    now?: Date;
  }): Promise<LocalOrderSplit> {
    const now = input.now ?? new Date();
    return this.uow.run(async (tx) => {
      const split = await this.splits.findByToken(input.shareToken, tx, true);
      if (!split) throw new LocalOrderSplitNotFoundError();
      const order = await this.orders.findById(split.orderId, tx, true);
      if (!order) throw new LocalOrderNotFoundError();
      if (order.paymentStatus === 'paid') throw new LocalOrderAlreadyPaidError();

      const payment = LocalOrderSplitPayment.create({
        id: randomUUID(),
        splitId: split.id,
        payerName: input.dto.payerName,
        amount: input.dto.amount,
        paidAt: now,
      });
      split.addPayment(payment, now);
      await this.splits.addPayment(payment, tx);
      if (split.isPaid) {
        order.markPaid(order.paymentMethod, now);
        await this.orders.save(order, tx);
        this.log.info({ orderId: order.id, splitId: split.id }, 'orders.order.paid');
      }
      this.log.info(
        { splitId: split.id, paymentId: payment.id, amount: payment.amount },
        'orders.split.payment_registered',
      );
      return split;
    });
  }
}
