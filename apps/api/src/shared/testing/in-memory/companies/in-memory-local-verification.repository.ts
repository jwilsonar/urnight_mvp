import type { LocalVerification } from '../../../../modules/companies/domain/entities/local-verification.entity';
import type { LocalVerificationRepository } from '../../../../modules/companies/domain/ports/local-verification.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** LocalVerificationRepository en memoria. */
export class InMemoryLocalVerificationRepository
  extends InMemoryRepository<LocalVerification>
  implements LocalVerificationRepository
{
  async create(verification: LocalVerification): Promise<LocalVerification> {
    this.put(verification);
    return verification;
  }

  async findById(id: string): Promise<LocalVerification | null> {
    return this.getById(id);
  }

  async update(verification: LocalVerification): Promise<LocalVerification> {
    this.put(verification);
    return verification;
  }
}
