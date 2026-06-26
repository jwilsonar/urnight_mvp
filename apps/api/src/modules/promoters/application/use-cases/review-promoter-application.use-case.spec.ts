import { describe, expect, it } from 'vitest';
import type { ReviewPromoterApplicationDto } from '@urnight/contracts';
import {
  InMemoryPromoterApplicationRepository,
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
} from '../../../../shared/testing/in-memory/promoters';
import { PromoterApplicationBuilder } from '../../../../shared/testing/builders/promoters';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes/fake-unit-of-work';
import {
  ApplicationAlreadyReviewedError,
  ApplicationNotFoundError,
} from '../../domain/errors/promoters.errors';
import { ReviewPromoterApplicationUseCase } from './review-promoter-application.use-case';

function build() {
  const applications = new InMemoryPromoterApplicationRepository();
  const links = new InMemoryReferralLinkRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const useCase = new ReviewPromoterApplicationUseCase(
    applications,
    promoters,
    links,
    fakeUnitOfWork(),
  );
  return { applications, links, promoters, useCase };
}

const COMPANY_ID = '44444444-4444-4444-4444-444444444444';
const approve: ReviewPromoterApplicationDto = { decision: 'approved', companyId: COMPANY_ID };
const reject: ReviewPromoterApplicationDto = { decision: 'rejected' };

describe('ReviewPromoterApplicationUseCase', () => {
  it('aprobar crea promotor + link, marca la postulación approved y la vincula', async () => {
    const { applications, promoters, links, useCase } = build();
    applications.seed(
      new PromoterApplicationBuilder()
        .withId('a1')
        .withName('Aspirante')
        .withApplicantUserId('user-9')
        .withLocalId('local-9')
        .build(),
    );

    const result = await useCase.execute({
      applicationId: 'a1',
      reviewerId: 'admin-1',
      reviewerCompanyId: null,
      isSuperAdmin: true,
      dto: approve,
    });

    expect(result.status).toBe('approved');
    expect(result.createdPromoterId).not.toBeNull();
    expect(promoters.size).toBe(1);
    const promoter = promoters.all[0];
    expect(promoter?.id).toBe(result.createdPromoterId);
    expect(promoter?.companyId).toBe(COMPANY_ID);
    expect(promoter?.localId).toBe('local-9');
    expect(promoter?.name).toBe('Aspirante');
    // El link de referido queda creado y vinculado.
    expect(await promoters.getLink(promoter?.id ?? '')).not.toBeNull();
    expect(links.size).toBe(1);
  });

  it('rechazar marca la postulación rejected y NO crea promotor', async () => {
    const { applications, promoters, links, useCase } = build();
    applications.seed(new PromoterApplicationBuilder().withId('a1').build());

    const result = await useCase.execute({
      applicationId: 'a1',
      reviewerId: 'admin-1',
      reviewerCompanyId: null,
      isSuperAdmin: true,
      dto: reject,
    });

    expect(result.status).toBe('rejected');
    expect(result.createdPromoterId).toBeNull();
    expect(promoters.size).toBe(0);
    expect(links.size).toBe(0);
  });

  it('postulación inexistente → ApplicationNotFoundError tipado', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ applicationId: 'ghost', reviewerId: 'admin-1', reviewerCompanyId: null, isSuperAdmin: true, dto: approve }),
    ).rejects.toBeInstanceOf(ApplicationNotFoundError);
  });

  it('postulación ya revisada (approved) → ApplicationAlreadyReviewedError tipado', async () => {
    const { applications, useCase } = build();
    applications.seed(new PromoterApplicationBuilder().withId('a1').asApproved().build());

    await expect(
      useCase.execute({ applicationId: 'a1', reviewerId: 'admin-1', reviewerCompanyId: null, isSuperAdmin: true, dto: approve }),
    ).rejects.toBeInstanceOf(ApplicationAlreadyReviewedError);
  });

  it('postulación ya rechazada → ApplicationAlreadyReviewedError tipado', async () => {
    const { applications, useCase } = build();
    applications.seed(new PromoterApplicationBuilder().withId('a1').asRejected().build());

    await expect(
      useCase.execute({ applicationId: 'a1', reviewerId: 'admin-1', reviewerCompanyId: null, isSuperAdmin: true, dto: reject }),
    ).rejects.toBeInstanceOf(ApplicationAlreadyReviewedError);
  });
});
