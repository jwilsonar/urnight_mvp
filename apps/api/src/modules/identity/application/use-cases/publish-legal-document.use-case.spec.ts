import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryLegalDocumentRepository,
  LegalDocumentBuilder,
  captureEvents,
} from '../../../../shared/testing';
import { PublishLegalDocumentUseCase } from './publish-legal-document.use-case';

function build() {
  const documents = new InMemoryLegalDocumentRepository();
  const events = new EventBus();
  const useCase = new PublishLegalDocumentUseCase(documents, events);
  return { documents, events, useCase };
}

describe('PublishLegalDocumentUseCase', () => {
  it('publica una nueva versión vigente y emite LegalDocumentPublishedEvent', async () => {
    const { documents, events, useCase } = build();
    const captured = captureEvents(events, 'identity.legal_document_published');

    const result = await useCase.execute({
      docType: 'terms',
      version: '2.0',
      contentUrl: 'https://cdn.urnight.pe/terms-2.0.pdf',
    });

    expect(result.isCurrent).toBe(true);
    expect(result.version).toBe('2.0');
    expect(await documents.findCurrent('terms')).not.toBeNull();
    expect(captured.names()).toContain('identity.legal_document_published');
  });

  it('supersede la versión vigente anterior (invariante: 1 current por tipo)', async () => {
    const { documents, useCase } = build();
    const prev = new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build();
    documents.seed(prev);

    await useCase.execute({
      docType: 'terms',
      version: '2.0',
      contentUrl: 'https://cdn.urnight.pe/terms-2.0.pdf',
    });

    expect(prev.isCurrent).toBe(false);
    const current = await documents.findCurrent('terms');
    expect(current?.version).toBe('2.0');
  });
});
