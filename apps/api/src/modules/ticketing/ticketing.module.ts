import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { PromotersModule } from '../promoters/promoters.module';
import { CheckoutUseCase } from './application/use-cases/checkout.use-case';
import {
  CreateTicketHoldUseCase,
  TICKET_HOLD_TTL_MS,
} from './application/use-cases/create-ticket-hold.use-case';
import { ConvertTicketHoldUseCase } from './application/use-cases/convert-ticket-hold.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ListMyTicketsUseCase } from './application/use-cases/list-my-tickets.use-case';
import { ReleaseTicketHoldUseCase } from './application/use-cases/release-ticket-hold.use-case';
import { ValidateQrUseCase } from './application/use-cases/validate-qr.use-case';
import { QrImageSubscriber } from './application/subscribers/qr-image.subscriber';
import { IDEMPOTENCY_STORE } from './domain/ports/idempotency.port';
import { INVENTORY_PORT } from './domain/ports/inventory.repository';
import { ORDER_REPOSITORY } from './domain/ports/order.repository';
import { PAYMENT_REPOSITORY } from './domain/ports/payment.repository';
import { PaymentPort } from './domain/ports/payment.port';
import { QR_IMAGE_PORT } from './domain/ports/qr-image.port';
import { QR_VALIDATION_REPOSITORY } from './domain/ports/qr-validation.repository';
import { TICKET_REPOSITORY } from './domain/ports/ticket.repository';
import { TICKET_HOLD_REPOSITORY } from './domain/ports/ticket-hold.repository';
import { MockPaymentAdapter } from './infrastructure/payment/mock-payment.adapter';
import { QrcodeImageAdapter } from './infrastructure/qr/qrcode-image.adapter';
import { DrizzleInventoryRepository } from './infrastructure/persistence/drizzle-inventory.repository';
import { DrizzleOrderRepository } from './infrastructure/persistence/drizzle-order.repository';
import { DrizzlePaymentRepository } from './infrastructure/persistence/drizzle-payment.repository';
import { DrizzleQrValidationRepository } from './infrastructure/persistence/drizzle-qr-validation.repository';
import { DrizzleTicketRepository } from './infrastructure/persistence/drizzle-ticket.repository';
import { DrizzleTicketHoldRepository } from './infrastructure/persistence/drizzle-ticket-hold.repository';
import { RedisIdempotencyStore } from './infrastructure/persistence/redis-idempotency.store';
import { OrdersController } from './interfaces/http/orders.controller';
import { TicketsController } from './interfaces/http/tickets.controller';
import { TicketHoldsController } from './interfaces/http/ticket-holds.controller';
import { ValidationController } from './interfaces/http/validation.controller';

/** Bounded context Checkout, Payments & Tickets (§4.1). */
@Module({
  imports: [PromotersModule],
  controllers: [
    OrdersController,
    TicketHoldsController,
    TicketsController,
    ValidationController,
  ],
  providers: [
    CheckoutUseCase,
    CreateTicketHoldUseCase,
    ConvertTicketHoldUseCase,
    ReleaseTicketHoldUseCase,
    GetOrderUseCase,
    ListMyTicketsUseCase,
    ValidateQrUseCase,
    QrImageSubscriber,
    { provide: ORDER_REPOSITORY, useClass: DrizzleOrderRepository },
    { provide: TICKET_REPOSITORY, useClass: DrizzleTicketRepository },
    { provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository },
    { provide: QR_VALIDATION_REPOSITORY, useClass: DrizzleQrValidationRepository },
    { provide: INVENTORY_PORT, useClass: DrizzleInventoryRepository },
    { provide: TICKET_HOLD_REPOSITORY, useClass: DrizzleTicketHoldRepository },
    {
      provide: TICKET_HOLD_TTL_MS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.get('TICKET_HOLD_TTL_SECONDS', { infer: true }) * 1000,
    },
    { provide: PaymentPort, useClass: MockPaymentAdapter },
    { provide: QR_IMAGE_PORT, useClass: QrcodeImageAdapter },
    { provide: IDEMPOTENCY_STORE, useClass: RedisIdempotencyStore },
  ],
})
export class TicketingModule {}
