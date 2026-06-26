import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PublishLegalDocumentDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { LegalDocument } from '../../domain/entities/legal-document.entity';
import { LegalDocumentPublishedEvent } from '../../domain/events/identity.events';
import {
  LEGAL_DOCUMENT_REPOSITORY,
  type LegalDocumentRepository,
} from '../../domain/ports/legal.repository';

/**
 * Caso de uso: publicar una nueva versión de documento legal. El repositorio
 * supersede el vigente e inserta el nuevo en una sola Tx (invariante: 1 current/tipo).
 */
@Injectable()
export class PublishLegalDocumentUseCase {
  private readonly log = createLogger(PublishLegalDocumentUseCase.name);

  constructor(
    @Inject(LEGAL_DOCUMENT_REPOSITORY)
    private readonly documents: LegalDocumentRepository,
    private readonly events: EventBus,
  ) {}

  async execute(dto: PublishLegalDocumentDto): Promise<LegalDocument> {
    this.log.debug({ docType: dto.docType, version: dto.version }, 'identity.legal_document.publish_started');
    const next = LegalDocument.publish({
      id: randomUUID(),
      docType: dto.docType,
      version: dto.version,
      contentUrl: dto.contentUrl,
    });
    const published = await this.documents.publish(next);
    this.log.info(
      { documentId: published.id, docType: published.docType, version: published.version },
      'identity.legal_document.published',
    );

    await this.events.publish(
      new LegalDocumentPublishedEvent({
        legalDocumentId: published.id,
        docType: published.docType,
        version: published.version,
      }),
    );
    return published;
  }
}
