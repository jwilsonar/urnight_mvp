import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, scopedCompanyId, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork, type Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type { TicketHold } from '../../domain/entities/ticket-hold.entity';
import {
  HoldExpiredError,
  HoldNotFoundError,
  HoldUnavailableError,
} from '../../domain/errors/checkout.errors';
import {
  INVENTORY_PORT,
  type InventoryPort,
} from '../../domain/ports/inventory.repository';
import {
  TICKET_HOLD_REPOSITORY,
  type TicketHoldRepository,
} from '../../domain/ports/ticket-hold.repository';

/** Convierte el hold al confirmar pago. El row lock hace idempotente el consumo. */
@Injectable()
export class ConvertTicketHoldUseCase {
  constructor(
    @Inject(TICKET_HOLD_REPOSITORY)
    private readonly holds: TicketHoldRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    private readonly uow: UnitOfWork,
  ) {}

  execute(input: {
    holdId: string;
    orderId: string;
    userId: string;
    scope: TenantScope;
    now?: Date;
  }): Promise<TicketHold> {
    return this.uow.run((tx) => this.executeInTransaction(input, tx));
  }

  async validateForCheckout(input: {
    holdId: string;
    userId: string;
    scope: TenantScope;
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    now?: Date;
  }): Promise<TicketHold> {
    const now = input.now ?? new Date();
    const hold = await this.holds.findById(input.holdId);
    if (!hold || hold.userId !== input.userId) throw new HoldNotFoundError();
    if (
      hold.eventId !== input.eventId ||
      hold.ticketTypeId !== input.ticketTypeId ||
      hold.quantity !== input.quantity
    ) {
      throw new HoldUnavailableError();
    }
    if (hold.status === 'active' && hold.expiresAt <= now) {
      throw new HoldExpiredError();
    }
    if (hold.status !== 'active') throw new HoldUnavailableError();

    const event = await this.inventory.getEvent(hold.eventId);
    if (!event) throw new HoldNotFoundError();
    if (scopedCompanyId(input.scope) !== undefined) {
      assertTenant(input.scope, event.companyId);
    }
    return hold;
  }

  async executeInTransaction(
    input: {
      holdId: string;
      orderId: string;
      userId: string;
      scope: TenantScope;
      now?: Date;
    },
    tx: Tx,
  ): Promise<TicketHold> {
    const now = input.now ?? new Date();
    const candidate = await this.holds.findById(input.holdId, tx);
    if (!candidate || candidate.userId !== input.userId) {
      throw new HoldNotFoundError();
    }
    const event = await this.inventory.getEvent(candidate.eventId);
    if (!event) throw new HoldNotFoundError();
    if (scopedCompanyId(input.scope) !== undefined) {
      assertTenant(input.scope, event.companyId);
    }

    await this.inventory.lockTicketTypes([candidate.ticketTypeId], tx);
    const hold = await this.holds.findByIdForUpdate(candidate.id, tx);
    if (!hold || hold.userId !== input.userId) throw new HoldNotFoundError();

    if (hold.status === 'converted') {
      if (hold.orderId !== input.orderId) throw new HoldUnavailableError();
      return hold;
    }
    if (hold.status === 'active' && hold.expiresAt <= now) {
      throw new HoldExpiredError();
    }
    if (hold.status !== 'active') throw new HoldUnavailableError();

    const converted = hold.convert(input.orderId, now);
    if (!converted) throw new HoldUnavailableError();
    await this.inventory.incrementSold(hold.ticketTypeId, hold.quantity, tx);
    await this.inventory.incrementEventTicketsSold(
      hold.eventId,
      hold.quantity,
      tx,
    );
    return this.holds.update(hold, tx);
  }
}
