import type { AffiliationRequest } from '../entities/affiliation-request.entity';

export interface AffiliationRequestRepository {
  create(request: AffiliationRequest): Promise<AffiliationRequest>;
  findById(id: string): Promise<AffiliationRequest | null>;
  update(request: AffiliationRequest, tx?: unknown): Promise<AffiliationRequest>;
}

export const AFFILIATION_REQUEST_REPOSITORY = Symbol('AFFILIATION_REQUEST_REPOSITORY');
