import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { captureEvents } from '../../../../shared/testing/fakes/capture-events';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes/fake-unit-of-work';
import {
  InMemoryAffiliationRequestRepository,
  InMemoryCompanyRepository,
  InMemoryLocalRepository,
} from '../../../../shared/testing/in-memory/companies';
import { AffiliationRequestBuilder } from '../../../../shared/testing/builders/companies';
import {
  AffiliationAlreadyReviewedError,
  AffiliationNotFoundError,
} from '../../domain/errors/companies.errors';
import { ReviewAffiliationUseCase } from './review-affiliation.use-case';

function build() {
  const requests = new InMemoryAffiliationRequestRepository();
  const companies = new InMemoryCompanyRepository();
  const locals = new InMemoryLocalRepository();
  const events = new EventBus();
  const useCase = new ReviewAffiliationUseCase(
    requests,
    companies,
    locals,
    fakeUnitOfWork(),
    events,
  );
  return { requests, companies, locals, events, useCase };
}

describe('ReviewAffiliationUseCase', () => {
  it('aprobar crea empresa+local atómicamente, vincula la solicitud y emite AffiliationApprovedEvent', async () => {
    const { requests, companies, locals, events, useCase } = build();
    await requests.create(
      new AffiliationRequestBuilder()
        .withId('a1')
        .withCommercialName('Aurora Club')
        .withRuc('20512345678')
        .build(),
    );
    const captured = captureEvents(events, 'companies.affiliation_approved');

    const result = await useCase.execute({
      requestId: 'a1',
      reviewerId: 'super-admin',
      dto: { decision: 'approved' },
    });

    expect(result.status).toBe('approved');
    expect(companies.size).toBe(1);
    expect(locals.size).toBe(1);
    const company = companies.all[0];
    const local = locals.all[0];
    expect(company?.ruc).toBe('20512345678');
    expect(local?.companyId).toBe(company?.id);
    expect(result.companyId).toBe(company?.id);
    expect(result.localId).toBe(local?.id);
    const event = captured.last();
    expect(event?.payload).toEqual({
      affiliationId: 'a1',
      companyId: company?.id,
      localId: local?.id,
    });
  });

  it('aprobar genera el slug del local a partir del nombre comercial', async () => {
    const { requests, locals, useCase } = build();
    await requests.create(
      new AffiliationRequestBuilder().withId('a1').withCommercialName('Aurora Club').build(),
    );

    await useCase.execute({
      requestId: 'a1',
      reviewerId: 'super-admin',
      dto: { decision: 'approved' },
    });

    expect(locals.all[0]?.slug).toMatch(/^aurora-club-/);
  });

  it('rechazar fija el motivo y NO crea empresa/local ni emite evento', async () => {
    const { requests, companies, locals, events, useCase } = build();
    await requests.create(new AffiliationRequestBuilder().withId('a1').build());
    const captured = captureEvents(events, 'companies.affiliation_approved');

    const result = await useCase.execute({
      requestId: 'a1',
      reviewerId: 'super-admin',
      dto: { decision: 'rejected', rejectionReason: 'RUC inválido' },
    });

    expect(result.status).toBe('rejected');
    expect(result.rejectionReason).toBe('RUC inválido');
    expect(companies.size).toBe(0);
    expect(locals.size).toBe(0);
    expect(captured.events).toHaveLength(0);
  });

  it('rechazar sin motivo usa "Sin motivo" por defecto', async () => {
    const { requests, useCase } = build();
    await requests.create(new AffiliationRequestBuilder().withId('a1').build());

    const result = await useCase.execute({
      requestId: 'a1',
      reviewerId: 'super-admin',
      dto: { decision: 'rejected' },
    });

    expect(result.rejectionReason).toBe('Sin motivo');
  });

  it('solicitud inexistente → AffiliationNotFoundError', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ requestId: 'ghost', reviewerId: 'a', dto: { decision: 'approved' } }),
    ).rejects.toBeInstanceOf(AffiliationNotFoundError);
  });

  it('solicitud ya revisada → AffiliationAlreadyReviewedError', async () => {
    const { requests, useCase } = build();
    await requests.create(new AffiliationRequestBuilder().withId('a1').approved().build());

    await expect(
      useCase.execute({ requestId: 'a1', reviewerId: 'a', dto: { decision: 'approved' } }),
    ).rejects.toBeInstanceOf(AffiliationAlreadyReviewedError);
  });
});
