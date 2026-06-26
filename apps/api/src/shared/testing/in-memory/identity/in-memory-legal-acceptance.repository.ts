import type { LegalAcceptance } from '../../../../modules/identity/domain/entities/legal-acceptance.entity';
import type { LegalAcceptanceRepository } from '../../../../modules/identity/domain/ports/legal.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** LegalAcceptanceRepository en memoria (constancias inmutables de aceptación). */
export class InMemoryLegalAcceptanceRepository
  extends InMemoryRepository<LegalAcceptance>
  implements LegalAcceptanceRepository
{
  async create(acceptance: LegalAcceptance): Promise<LegalAcceptance> {
    this.put(acceptance);
    return acceptance;
  }

  async findByUser(userId: string): Promise<LegalAcceptance[]> {
    return this.values().filter((a) => a.userId === userId);
  }
}
