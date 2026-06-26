import type { DomainEvent } from '../../../../shared/event-bus/domain-event';

export class LocalPublishedEvent implements DomainEvent<{ localId: string; companyId: string }> {
  readonly name = 'companies.local_published';
  readonly occurredAt = new Date();
  constructor(readonly payload: { localId: string; companyId: string }) {}
}

export class LocalVerifiedEvent implements DomainEvent<{ localId: string; verified: boolean }> {
  readonly name = 'companies.local_verified';
  readonly occurredAt = new Date();
  constructor(readonly payload: { localId: string; verified: boolean }) {}
}

export class AffiliationApprovedEvent
  implements DomainEvent<{ affiliationId: string; companyId: string; localId: string }>
{
  readonly name = 'companies.affiliation_approved';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: { affiliationId: string; companyId: string; localId: string },
  ) {}
}
