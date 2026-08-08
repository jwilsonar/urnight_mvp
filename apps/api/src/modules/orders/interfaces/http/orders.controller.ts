import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  advanceLocalOrderStatusSchema,
  createLocalOrderSchema,
  payLocalOrderSchema,
  registerLocalOrderSplitPaymentSchema,
  type AdvanceLocalOrderStatusDto,
  type CreateLocalOrderDto,
  type LocalOrderResponse,
  type LocalOrderSplitResponse,
  type PayLocalOrderDto,
  type RegisterLocalOrderSplitPaymentDto,
} from '@urnight/contracts';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { AdvanceLocalOrderStatusUseCase } from '../../application/use-cases/advance-local-order-status.use-case';
import { CreateLocalOrderSplitUseCase } from '../../application/use-cases/create-local-order-split.use-case';
import { CreateLocalOrderUseCase } from '../../application/use-cases/create-local-order.use-case';
import { GetLocalOrderSplitUseCase } from '../../application/use-cases/get-local-order-split.use-case';
import { GetMyLocalOrderUseCase } from '../../application/use-cases/get-my-local-order.use-case';
import { ListLocalOrderQueueUseCase } from '../../application/use-cases/list-local-order-queue.use-case';
import { PayLocalOrderUseCase } from '../../application/use-cases/pay-local-order.use-case';
import { RegisterLocalOrderSplitPaymentUseCase } from '../../application/use-cases/register-local-order-split-payment.use-case';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import type { LocalOrderSplit } from '../../domain/entities/local-order-split.entity';

@Controller()
export class LocalOrdersController {
  constructor(
    private readonly createOrder: CreateLocalOrderUseCase,
    private readonly listQueue: ListLocalOrderQueueUseCase,
    private readonly getMine: GetMyLocalOrderUseCase,
    private readonly advanceStatus: AdvanceLocalOrderStatusUseCase,
    private readonly payOrder: PayLocalOrderUseCase,
    private readonly createSplit: CreateLocalOrderSplitUseCase,
    private readonly getSplit: GetLocalOrderSplitUseCase,
    private readonly registerSplitPayment: RegisterLocalOrderSplitPaymentUseCase,
  ) {}

  @Roles('user', 'staff', 'super_admin')
  @Post('locals/:localId/orders')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(createLocalOrderSchema)) dto: CreateLocalOrderDto,
  ): Promise<LocalOrderResponse> {
    const userId = actor.roles.includes('user') ? actor.id : null;
    return toLocalOrderResponse(
      await this.createOrder.execute({ localId, userId, dto }),
    );
  }

  @Roles('staff', 'admin_local', 'super_admin')
  @Get('locals/:localId/orders/queue')
  async queue(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
  ): Promise<LocalOrderResponse[]> {
    return (
      await this.listQueue.execute({ localId, scope: tenantScopeOf(actor) })
    ).map(toLocalOrderResponse);
  }

  @Roles('staff', 'super_admin')
  @Patch('locals/:localId/orders/:orderId/status')
  async changeStatus(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body(new ZodValidationPipe(advanceLocalOrderStatusSchema))
    dto: AdvanceLocalOrderStatusDto,
  ): Promise<LocalOrderResponse> {
    return toLocalOrderResponse(
      await this.advanceStatus.execute({
        localId,
        orderId,
        status: dto.status,
        actorRoles: actor.roles,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Roles('user')
  @Get('local-orders/:orderId')
  async mine(
    @CurrentUser() actor: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<LocalOrderResponse> {
    return toLocalOrderResponse(
      await this.getMine.execute({ orderId, userId: actor.id }),
    );
  }

  @Roles('user')
  @Post('local-orders/:orderId/pay')
  async pay(
    @CurrentUser() actor: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body(new ZodValidationPipe(payLocalOrderSchema)) dto: PayLocalOrderDto,
  ): Promise<LocalOrderResponse> {
    return toLocalOrderResponse(
      await this.payOrder.execute({ orderId, userId: actor.id, dto }),
    );
  }

  @Roles('user')
  @Post('local-orders/:orderId/split')
  @HttpCode(HttpStatus.CREATED)
  async split(
    @CurrentUser() actor: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<LocalOrderSplitResponse> {
    return toLocalOrderSplitResponse(
      await this.createSplit.execute({ orderId, userId: actor.id }),
    );
  }

  @Public()
  @Get('local-order-splits/:shareToken')
  async sharedSplit(
    @Param('shareToken') shareToken: string,
  ): Promise<LocalOrderSplitResponse> {
    return toLocalOrderSplitResponse(await this.getSplit.execute(shareToken));
  }

  @Public()
  @Post('local-order-splits/:shareToken/payments')
  @HttpCode(HttpStatus.CREATED)
  async addSplitPayment(
    @Param('shareToken') shareToken: string,
    @Body(new ZodValidationPipe(registerLocalOrderSplitPaymentSchema))
    dto: RegisterLocalOrderSplitPaymentDto,
  ): Promise<LocalOrderSplitResponse> {
    return toLocalOrderSplitResponse(
      await this.registerSplitPayment.execute({ shareToken, dto }),
    );
  }
}

export function toLocalOrderResponse(order: LocalOrder): LocalOrderResponse {
  return {
    id: order.id,
    localId: order.localId,
    userId: order.userId,
    attendeeName: order.attendeeName,
    pickupCode: order.pickupCode,
    pickupZone: order.pickupZone,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      lineAmount: item.lineAmount,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export function toLocalOrderSplitResponse(
  split: LocalOrderSplit,
): LocalOrderSplitResponse {
  return {
    id: split.id,
    orderId: split.orderId,
    shareToken: split.shareToken,
    expectedTotal: split.expectedTotal,
    paidTotal: split.paidTotal,
    remainingAmount: split.remainingAmount,
    isPaid: split.isPaid,
    payments: split.payments.map((payment) => ({
      id: payment.id,
      payerName: payment.payerName,
      amount: payment.amount,
      paidAt: payment.paidAt.toISOString(),
    })),
    createdAt: split.createdAt.toISOString(),
  };
}
