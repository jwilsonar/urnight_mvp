import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  createTicketTypeSchema,
  type CreateTicketTypeDto,
  type TicketTypeResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateTicketTypeUseCase } from '../../application/use-cases/create-ticket-type.use-case';
import { toTicketTypeResponse } from './events.controller';

/** Tipos de entrada (TICKET_TYPE). /api/v1/ticket-types. */
@Roles('admin_local')
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly createTicketType: CreateTicketTypeUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createTicketTypeSchema)) dto: CreateTicketTypeDto,
  ): Promise<TicketTypeResponse> {
    return toTicketTypeResponse(
      await this.createTicketType.execute({ dto, scope: tenantScopeOf(actor) }),
    );
  }
}
