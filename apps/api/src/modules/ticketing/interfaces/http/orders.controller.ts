import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  createOrderSchema,
  type CreateOrderDto,
  type OrderResponse,
  type TicketResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CheckoutUseCase } from '../../application/use-cases/checkout.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import type { Order } from '../../domain/entities/order.entity';
import type { Ticket } from '../../domain/entities/ticket.entity';
import type { TicketEventDetail } from '../../domain/ports/ticket.repository';

export interface CheckoutHttpResponse {
  order: OrderResponse;
  tickets: TicketResponse[];
}

/** Checkout y órdenes. /api/v1/orders. Requiere autenticación. */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly checkout: CheckoutUseCase,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkoutOrder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderDto,
    // M3: idempotencia — reintentos con la misma key devuelven la orden ya creada.
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CheckoutHttpResponse> {
    const result = await this.checkout.execute({
      userId: user.id,
      dto,
      idempotencyKey: idempotencyKey?.trim() || undefined,
    });
    return {
      order: toOrderResponse(result.order),
      tickets: result.tickets.map((t) => toTicketResponse(t.ticket, t.attendee.fullName)),
    };
  }

  @Get(':id')
  async detail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponse> {
    return toOrderResponse(await this.getOrder.execute({ orderId: id, userId: user.id }));
  }
}

export function toOrderResponse(o: Order): OrderResponse {
  return {
    id: o.id,
    orderCode: o.orderCode,
    eventId: o.eventId,
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    commissionAmount: o.commissionAmount,
    total: o.total,
    currency: o.currency,
    status: o.status,
    items: o.items.map((i) => ({
      id: i.id,
      ticketTypeId: i.ticketTypeId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
  };
}

export function toTicketResponse(
  t: Ticket,
  attendeeName: string,
  detail?: TicketEventDetail,
): TicketResponse {
  return {
    id: t.id,
    eventId: t.eventId,
    ticketTypeId: t.ticketTypeId,
    qrCode: t.qrCode,
    qrImageKey: t.qrImageKey,
    status: t.status,
    issuedAt: t.issuedAt.toISOString(),
    attendeeName,
    eventName: detail?.eventName ?? null,
    eventStartsAt: detail ? detail.eventStartsAt.toISOString() : null,
    eventFlyerKey: detail?.eventFlyerKey ?? null,
    venueName: detail?.venueName ?? null,
    ticketTypeName: detail?.ticketTypeName ?? null,
  };
}
