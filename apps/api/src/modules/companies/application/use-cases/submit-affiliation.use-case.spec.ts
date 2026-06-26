import { describe, expect, it } from 'vitest';
import { InMemoryAffiliationRequestRepository } from '../../../../shared/testing/in-memory/companies';
import { SubmitAffiliationUseCase } from './submit-affiliation.use-case';

function build() {
  const requests = new InMemoryAffiliationRequestRepository();
  const useCase = new SubmitAffiliationUseCase(requests);
  return { requests, useCase };
}

const dto = {
  legalName: 'Discoteca Aurora S.A.C.',
  ruc: '20512345678',
  commercialName: 'Aurora Club',
};

describe('SubmitAffiliationUseCase', () => {
  it('crea una solicitud pending y la persiste', async () => {
    const { requests, useCase } = build();

    const request = await useCase.execute({ dto, submittedBy: 'user-1' });

    expect(request.status).toBe('pending');
    expect(request.isPending()).toBe(true);
    expect(request.ruc).toBe('20512345678');
    expect(request.companyId).toBeNull();
    expect(request.localId).toBeNull();
    expect(requests.size).toBe(1);
  });

  it('acepta solicitud anónima (submittedBy ausente)', async () => {
    const { requests, useCase } = build();

    const request = await useCase.execute({ dto });

    expect(request.status).toBe('pending');
    expect(requests.size).toBe(1);
  });
});
