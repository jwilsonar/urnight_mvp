import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryLegalAcceptanceRepository,
  InMemoryLegalDocumentRepository,
  LegalDocumentMother,
  captureEvents,
} from '../../../../shared/testing';
import { LegalDocumentNotFoundError } from '../../domain/errors/identity.errors';
import { AcceptLegalDocumentUseCase } from './accept-legal-document.use-case';

function build() {
  const documents = new InMemoryLegalDocumentRepository();
  const acceptances = new InMemoryLegalAcceptanceRepository();
  const events = new EventBus();
  const useCase = new AcceptLegalDocumentUseCase(documents, acceptances, events);
  return { documents, acceptances, events, useCase };
}

describe('AcceptLegalDocumentUseCase', () => {
  it('registra la aceptación con snapshot de versión e IP, y emite LegalAcceptedEvent', async () => {
    const { documents, acceptances, events, useCase } = build();
    const doc = LegalDocumentMother.currentTerms();
    documents.seed(doc);
    const captured = captureEvents(events, 'identity.legal_accepted');

    const result = await useCase.execute({
      userId: 'u1',
      legalDocumentId: doc.id,
      ipAddress: '8.8.8.8',
    });

    expect(result.versionAccepted).toBe(doc.version);
    expect(result.userId).toBe('u1');
    expect(result.ipAddress).toBe('8.8.8.8');
    expect(await acceptances.findByUser('u1')).toHaveLength(1);
    expect(captured.names()).toContain('identity.legal_accepted');
  });

  it('documento inexistente → LegalDocumentNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ userId: 'u1', legalDocumentId: 'ghost' }),
    ).rejects.toBeInstanceOf(LegalDocumentNotFoundError);
  });
});
