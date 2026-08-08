import { Module } from '@nestjs/common';
import { AdvanceLocalOrderStatusUseCase } from './application/use-cases/advance-local-order-status.use-case';
import { CreateLocalOrderSplitUseCase } from './application/use-cases/create-local-order-split.use-case';
import { CreateLocalOrderUseCase } from './application/use-cases/create-local-order.use-case';
import { GetLocalOrderSplitUseCase } from './application/use-cases/get-local-order-split.use-case';
import { GetMyLocalOrderUseCase } from './application/use-cases/get-my-local-order.use-case';
import { ListLocalOrderQueueUseCase } from './application/use-cases/list-local-order-queue.use-case';
import { PayLocalOrderUseCase } from './application/use-cases/pay-local-order.use-case';
import { RegisterLocalOrderSplitPaymentUseCase } from './application/use-cases/register-local-order-split-payment.use-case';
import { LOCAL_ORDER_REPOSITORY } from './domain/ports/local-order.repository';
import { LOCAL_ORDER_SPLIT_REPOSITORY } from './domain/ports/local-order-split.repository';
import { ORDERS_CATALOG_PORT } from './domain/ports/orders-catalog.port';
import { ORDERS_PAYMENT_PORT } from './domain/ports/orders-payment.port';
import { DrizzleLocalOrderRepository } from './infrastructure/persistence/drizzle-local-order.repository';
import { DrizzleLocalOrderSplitRepository } from './infrastructure/persistence/drizzle-local-order-split.repository';
import { DrizzleOrdersCatalogAdapter } from './infrastructure/persistence/drizzle-orders-catalog.adapter';
import { LocalOrdersController } from './interfaces/http/orders.controller';
import { MockPaymentAdapter } from '../ticketing/infrastructure/payment/mock-payment.adapter';

@Module({
  controllers: [LocalOrdersController],
  providers: [
    CreateLocalOrderUseCase,
    ListLocalOrderQueueUseCase,
    GetMyLocalOrderUseCase,
    AdvanceLocalOrderStatusUseCase,
    PayLocalOrderUseCase,
    CreateLocalOrderSplitUseCase,
    GetLocalOrderSplitUseCase,
    RegisterLocalOrderSplitPaymentUseCase,
    { provide: LOCAL_ORDER_REPOSITORY, useClass: DrizzleLocalOrderRepository },
    { provide: LOCAL_ORDER_SPLIT_REPOSITORY, useClass: DrizzleLocalOrderSplitRepository },
    { provide: ORDERS_CATALOG_PORT, useClass: DrizzleOrdersCatalogAdapter },
    { provide: ORDERS_PAYMENT_PORT, useClass: MockPaymentAdapter },
  ],
})
export class OrdersModule {}
