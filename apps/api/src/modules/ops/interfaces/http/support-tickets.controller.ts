import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  createSupportTicketSchema,
  resolveSupportTicketSchema,
  type CreateSupportTicketDto,
  type ResolveSupportTicketDto,
  type SupportTicketResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateSupportTicketUseCase } from '../../application/use-cases/create-support-ticket.use-case';
import { ResolveSupportTicketUseCase } from '../../application/use-cases/resolve-support-ticket.use-case';
import type { SupportTicket } from '../../domain/entities/support-ticket.entity';

/** Soporte interno. /api/v1/support-tickets. Abrir: admin_local. Gestionar: super_admin. */
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(
    private readonly createTicket: CreateSupportTicketUseCase,
    private readonly resolveTicket: ResolveSupportTicketUseCase,
  ) {}

  @Roles('admin_local')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createSupportTicketSchema)) dto: CreateSupportTicketDto,
  ): Promise<SupportTicketResponse> {
    return toResponse(await this.createTicket.execute({ dto, openedBy: actor.id }));
  }

  @Roles('super_admin')
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(resolveSupportTicketSchema)) dto: ResolveSupportTicketDto,
  ): Promise<SupportTicketResponse> {
    return toResponse(await this.resolveTicket.execute({ ticketId: id, dto }));
  }
}

function toResponse(t: SupportTicket): SupportTicketResponse {
  return {
    id: t.id,
    ticketCode: t.ticketCode,
    subject: t.subject,
    category: t.category,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt.toISOString(),
  };
}
