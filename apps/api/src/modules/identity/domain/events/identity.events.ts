import type { DomainEvent } from '../../../../shared/event-bus/domain-event';
import type { AuthProvider } from '../entities/user.entity';
import type { RoleCode } from '../entities/role.entity';
import type { LegalDocType } from '../entities/legal-document.entity';

/** Emitido al registrar un usuario → dispara email de verificación y rol por defecto. */
export class UserRegisteredEvent
  implements DomainEvent<{ userId: string; email: string; authProvider: AuthProvider }>
{
  readonly name = 'identity.user_registered';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: { userId: string; email: string; authProvider: AuthProvider },
  ) {}
}

export class EmailVerifiedEvent implements DomainEvent<{ userId: string }> {
  readonly name = 'identity.email_verified';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string }) {}
}

export class EmailChangedEvent implements DomainEvent<{ userId: string }> {
  readonly name = 'identity.email.changed';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string }) {}
}

export class RoleGrantedEvent
  implements
    DomainEvent<{
      userId: string;
      roleCode: RoleCode;
      companyId: string | null;
      localId: string | null;
    }>
{
  readonly name = 'identity.role_granted';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: {
      userId: string;
      roleCode: RoleCode;
      companyId: string | null;
      localId: string | null;
    },
  ) {}
}

export class RoleRevokedEvent
  implements DomainEvent<{ userId: string; assignmentId: string }>
{
  readonly name = 'identity.role_revoked';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; assignmentId: string }) {}
}

export class LegalDocumentPublishedEvent
  implements DomainEvent<{ legalDocumentId: string; docType: LegalDocType; version: string }>
{
  readonly name = 'identity.legal_document_published';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: { legalDocumentId: string; docType: LegalDocType; version: string },
  ) {}
}

export class LegalAcceptedEvent
  implements
    DomainEvent<{ userId: string; legalDocumentId: string; versionAccepted: string }>
{
  readonly name = 'identity.legal_accepted';
  readonly occurredAt = new Date();
  constructor(
    readonly payload: { userId: string; legalDocumentId: string; versionAccepted: string },
  ) {}
}
