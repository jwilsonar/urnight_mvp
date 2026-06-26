import type { AffiliationRequest } from '../../../../modules/companies/domain/entities/affiliation-request.entity';
import type { AffiliationRequestRepository } from '../../../../modules/companies/domain/ports/affiliation-request.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** AffiliationRequestRepository en memoria. */
export class InMemoryAffiliationRequestRepository
  extends InMemoryRepository<AffiliationRequest>
  implements AffiliationRequestRepository
{
  async create(request: AffiliationRequest): Promise<AffiliationRequest> {
    this.put(request);
    return request;
  }

  async findById(id: string): Promise<AffiliationRequest | null> {
    return this.getById(id);
  }

  async update(request: AffiliationRequest, _tx?: unknown): Promise<AffiliationRequest> {
    this.put(request);
    return request;
  }
}
