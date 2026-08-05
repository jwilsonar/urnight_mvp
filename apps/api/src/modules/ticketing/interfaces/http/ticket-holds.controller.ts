import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  createTicketHoldSchema,
  type CreateTicketHoldDto,
  type TicketHoldResponse,
} from '@urnight/contracts';
import {
  CurrentUser,
  type AuthUser,
} from '../../../../edge/decorators/current-user.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateTicketHoldUseCase } from '../../application/use-cases/create-ticket-hold.use-case';
import { ReleaseTicketHoldUseCase } from '../../application/use-cases/release-ticket-hold.use-case';
import type { TicketHold } from '../../domain/entities/ticket-hold.entity';

@Controller('ticket-holds')
export class TicketHoldsController {
  constructor(
    private readonly createHold: CreateTicketHoldUseCase,
    private readonly releaseHold: ReleaseTicketHoldUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createTicketHoldSchema))
    dto: CreateTicketHoldDto,
  ): Promise<TicketHoldResponse> {
    return toTicketHoldResponse(
      await this.createHold.execute({
        userId: actor.id,
        scope: tenantScopeOf(actor),
        dto,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async release(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.releaseHold.execute({
      holdId: id,
      userId: actor.id,
      scope: tenantScopeOf(actor),
    });
  }
}

export function toTicketHoldResponse(hold: TicketHold): TicketHoldResponse {
  return {
    id: hold.id,
    eventId: hold.eventId,
    ticketTypeId: hold.ticketTypeId,
    orderId: hold.orderId,
    userId: hold.userId,
    quantity: hold.quantity,
    status: hold.status,
    expiresAt: hold.expiresAt.toISOString(),
    createdAt: hold.createdAt.toISOString(),
  };
}
