import type { DomainEvent } from '../../../../shared/event-bus/domain-event';

/**
 * Emitido cuando la persona invitada confirma la asociación como promotor.
 * Identity reacciona otorgándole el rol `promoter` con scope multi-tenant
 * (company/local), sin pasar por el endpoint de grant-role (super_admin).
 */
export class PromoterAssociationConfirmedEvent
  implements
    DomainEvent<{
      promoterId: string;
      userId: string;
      companyId: string;
      localId: string | null;
    }>
{
  readonly name = 'promoters.association_confirmed';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: {
      promoterId: string;
      userId: string;
      companyId: string;
      localId: string | null;
    },
  ) {}
}
