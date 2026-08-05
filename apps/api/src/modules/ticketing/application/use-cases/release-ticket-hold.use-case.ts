import { Inject, Injectable } from '@nestjs/common';
import {
  assertTenant,
  scopedCompanyId,
  type TenantScope,
} from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import type { TicketHold } from '../../domain/entities/ticket-hold.entity';
import { HoldNotFoundError } from '../../domain/errors/checkout.errors';
import {
  INVENTORY_PORT,
  type InventoryPort,
} from '../../domain/ports/inventory.repository';
import {
  TICKET_HOLD_REPOSITORY,
  type TicketHoldRepository,
} from '../../domain/ports/ticket-hold.repository';

/** Liberación explícita por cancelación o abandono confirmado por el cliente. */
@Injectable()
export class ReleaseTicketHoldUseCase {
  constructor(
    @Inject(TICKET_HOLD_REPOSITORY)
    private readonly holds: TicketHoldRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    holdId: string;
    userId: string;
    scope: TenantScope;
    now?: Date;
  }): Promise<TicketHold> {
    const now = input.now ?? new Date();
    const candidate = await this.holds.findById(input.holdId);
    if (!candidate || candidate.userId !== input.userId) {
      throw new HoldNotFoundError();
    }
    const event = await this.inventory.getEvent(candidate.eventId);
    if (!event) throw new HoldNotFoundError();
    if (scopedCompanyId(input.scope) !== undefined) {
      assertTenant(input.scope, event.companyId);
    }

    return this.uow.run(async (tx) => {
      await this.inventory.lockTicketTypes([candidate.ticketTypeId], tx);
      const hold = await this.holds.findByIdForUpdate(candidate.id, tx);
      if (!hold || hold.userId !== input.userId) {
        throw new HoldNotFoundError();
      }
      hold.release(now);
      return this.holds.update(hold, tx);
    });
  }
}
