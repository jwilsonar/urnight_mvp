import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { LegalAcceptance } from '../../domain/entities/legal-acceptance.entity';
import { LegalDocumentNotFoundError } from '../../domain/errors/identity.errors';
import { LegalAcceptedEvent } from '../../domain/events/identity.events';
import {
  LEGAL_ACCEPTANCE_REPOSITORY,
  LEGAL_DOCUMENT_REPOSITORY,
  type LegalAcceptanceRepository,
  type LegalDocumentRepository,
} from '../../domain/ports/legal.repository';

/** Caso de uso: registrar la aceptación de un documento legal por el usuario. */
@Injectable()
export class AcceptLegalDocumentUseCase {
  private readonly log = createLogger(AcceptLegalDocumentUseCase.name);

  constructor(
    @Inject(LEGAL_DOCUMENT_REPOSITORY)
    private readonly documents: LegalDocumentRepository,
    @Inject(LEGAL_ACCEPTANCE_REPOSITORY)
    private readonly acceptances: LegalAcceptanceRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: {
    userId: string;
    legalDocumentId: string;
    ipAddress?: string | null;
  }): Promise<LegalAcceptance> {
    this.log.debug({ userId: input.userId, legalDocumentId: input.legalDocumentId }, 'identity.legal_document.accept_started');
    const document = await this.documents.findById(input.legalDocumentId);
    if (!document) {
      this.log.warn({ userId: input.userId, legalDocumentId: input.legalDocumentId }, 'identity.legal_document.not_found');
      throw new LegalDocumentNotFoundError();
    }

    const acceptance = LegalAcceptance.record({
      id: randomUUID(),
      userId: input.userId,
      legalDocumentId: document.id,
      versionAccepted: document.version,
      ipAddress: input.ipAddress ?? null,
    });
    const saved = await this.acceptances.create(acceptance);
    this.log.info({ userId: input.userId, legalDocumentId: document.id }, 'identity.legal_document.accepted');

    await this.events.publish(
      new LegalAcceptedEvent({
        userId: input.userId,
        legalDocumentId: document.id,
        versionAccepted: document.version,
      }),
    );
    return saved;
  }
}
