import type { AffiliationRequest } from '../../../../modules/companies/domain/entities/affiliation-request.entity';
import { AffiliationRequestBuilder } from '../../builders/companies/affiliation-request.builder';

/** Casos predefinidos de AffiliationRequest. */
export const AffiliationRequestMother = {
  pending: (): AffiliationRequest => new AffiliationRequestBuilder().build(),
  approved: (): AffiliationRequest => new AffiliationRequestBuilder().approved().build(),
  rejected: (): AffiliationRequest => new AffiliationRequestBuilder().rejected().build(),
};
