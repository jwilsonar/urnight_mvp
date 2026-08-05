import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateTicketHoldDto } from '@urnight/contracts';
import { assertTenant, scopedCompanyId, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { TicketHold } from '../../domain/entities/ticket-hold.entity';
import {
  EventNotOnSaleError,
  HoldNotFoundError,
  HoldUnavailableError,
  InsufficientCapacityError,
  MaxPerUserExceededError,
  TicketTypeNotFoundError,
  TicketTypeUnavailableError,
} from '../../domain/errors/checkout.errors';
import {
  INVENTORY_PORT,
  type InventoryPort,
} from '../../domain/ports/inventory.repository';
import {
  TICKET_HOLD_REPOSITORY,
  type TicketHoldRepository,
} from '../../domain/ports/ticket-hold.repository';

export const TICKET_HOLD_TTL_MS = Symbol('TICKET_HOLD_TTL_MS');

/** Crea o reemplaza un hold dentro de la misma Tx y bajo row lock de ticket_type. */
@Injectable()
export class CreateTicketHoldUseCase {
  constructor(
    @Inject(TICKET_HOLD_REPOSITORY)
    private readonly holds: TicketHoldRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    private readonly uow: UnitOfWork,
    @Inject(TICKET_HOLD_TTL_MS) private readonly ttlMs: number,
  ) {}

  async execute(input: {
    userId: string;
    scope: TenantScope;
    dto: CreateTicketHoldDto;
    now?: Date;
  }): Promise<TicketHold> {
    const now = input.now ?? new Date();
    const event = await this.inventory.getEvent(input.dto.eventId);
    if (!event || !event.isOnSale) throw new EventNotOnSaleError();
    this.assertTenantWhenScoped(input.scope, event.companyId);

    const replacement = input.dto.replaceHoldId
      ? await this.holds.findById(input.dto.replaceHoldId)
      : null;
    if (input.dto.replaceHoldId && (!replacement || replacement.userId !== input.userId)) {
      throw new HoldNotFoundError();
    }

    return this.uow.run(async (tx) => {
      const lockIds = [
        input.dto.ticketTypeId,
        ...(replacement ? [replacement.ticketTypeId] : []),
      ];
      await this.inventory.lockTicketTypes(lockIds, tx);

      if (replacement) {
        const locked = await this.holds.findByIdForUpdate(replacement.id, tx);
        if (!locked || locked.userId !== input.userId) throw new HoldNotFoundError();
        if (locked.eventId !== input.dto.eventId || locked.status !== 'active') {
          throw new HoldUnavailableError();
        }
        locked.release(now);
        await this.holds.update(locked, tx);
      }

      const ticketType = await this.inventory.getTicketType(
        input.dto.ticketTypeId,
        tx,
      );
      if (!ticketType || ticketType.eventId !== input.dto.eventId) {
        throw new TicketTypeNotFoundError();
      }
      if (ticketType.status !== 'active') throw new TicketTypeUnavailableError();
      if (
        ticketType.maxPerUser !== null &&
        input.dto.quantity > ticketType.maxPerUser
      ) {
        throw new MaxPerUserExceededError();
      }

      const available = await this.holds.availableCapacity(
        ticketType.id,
        now,
        tx,
      );
      if (available < input.dto.quantity) {
        throw new InsufficientCapacityError();
      }

      return this.holds.create(
        TicketHold.create({
          id: randomUUID(),
          eventId: input.dto.eventId,
          ticketTypeId: input.dto.ticketTypeId,
          userId: input.userId,
          quantity: input.dto.quantity,
          expiresAt: new Date(now.getTime() + this.ttlMs),
          now,
        }),
        tx,
      );
    });
  }

  private assertTenantWhenScoped(
    scope: TenantScope,
    companyId: string,
  ): void {
    if (scopedCompanyId(scope) !== undefined) assertTenant(scope, companyId);
  }
}
