import { describe, expect, it } from 'vitest';
import {
  InMemoryLegalDocumentRepository,
  LegalDocumentMother,
} from '../../../../shared/testing';
import { LegalDocumentNotFoundError } from '../../domain/errors/identity.errors';
import { GetCurrentLegalDocumentUseCase } from './get-current-legal-document.use-case';

function build() {
  const documents = new InMemoryLegalDocumentRepository();
  const useCase = new GetCurrentLegalDocumentUseCase(documents);
  return { documents, useCase };
}

describe('GetCurrentLegalDocumentUseCase', () => {
  it('devuelve el documento vigente del tipo solicitado', async () => {
    const { documents, useCase } = build();
    documents.seed(LegalDocumentMother.currentTerms());

    const result = await useCase.execute({ docType: 'terms' });

    expect(result.docType).toBe('terms');
    expect(result.isCurrent).toBe(true);
  });

  it('sin documento vigente → LegalDocumentNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ docType: 'privacy' })).rejects.toBeInstanceOf(
      LegalDocumentNotFoundError,
    );
  });
});
