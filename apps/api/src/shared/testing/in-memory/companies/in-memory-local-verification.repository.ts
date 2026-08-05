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

  async findLatestByLocalId(localId: string): Promise<LocalVerification | null> {
    return (
      this.values()
        .filter((verification) => verification.localId === localId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null
    );
  }

  async update(verification: LocalVerification): Promise<LocalVerification> {
    this.put(verification);
    return verification;
  }
}
