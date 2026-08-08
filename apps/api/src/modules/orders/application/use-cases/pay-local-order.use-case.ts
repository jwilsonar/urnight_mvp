import { Inject, Injectable } from '@nestjs/common';
import type { PayLocalOrderDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import {
  LocalOrderAlreadyPaidError,
  LocalOrderNotFoundError,
  LocalOrderPaymentRejectedError,
} from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';
import {
  ORDERS_PAYMENT_PORT,
  type OrdersPaymentPort,
} from '../../domain/ports/orders-payment.port';

@Injectable()
export class PayLocalOrderUseCase {
  private readonly log = createLogger(PayLocalOrderUseCase.name);

  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(ORDERS_PAYMENT_PORT) private readonly payment: OrdersPaymentPort,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    orderId: string;
    userId: string;
    dto: PayLocalOrderDto;
    now?: Date;
  }): Promise<LocalOrder> {
    return this.uow.run(async (tx) => {
      const order = await this.orders.findMine(input.orderId, input.userId, tx);
      if (!order) throw new LocalOrderNotFoundError();
      if (order.paymentStatus === 'paid') throw new LocalOrderAlreadyPaidError();
      const result = await this.payment.charge({
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        method: input.dto.method,
      });
      if (!result.approved) throw new LocalOrderPaymentRejectedError(result.failureReason);
      order.markPaid(input.dto.method, input.now);
      await this.orders.save(order, tx);
      this.log.info(
        { orderId: order.id, method: order.paymentMethod, reference: result.reference },
        'orders.order.paid',
      );
      return order;
    });
  }
}
