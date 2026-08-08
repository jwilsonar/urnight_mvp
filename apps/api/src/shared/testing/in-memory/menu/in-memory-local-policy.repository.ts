import type { LocalOrderWindow } from '../../../../modules/menu/domain/entities/local-order-window.entity';
import type { LocalPolicy } from '../../../../modules/menu/domain/entities/local-policy.entity';
import type { LocalPolicyRepository } from '../../../../modules/menu/domain/ports/local-policy.repository';
import { InMemoryRepository } from '../in-memory.repository';

export class InMemoryLocalPolicyRepository
  extends InMemoryRepository<LocalPolicy>
  implements LocalPolicyRepository
{
  private readonly windowsByLocal = new Map<string, LocalOrderWindow[]>();

  async findPolicy(localId: string): Promise<LocalPolicy | null> {
    return this.values().find((policy) => policy.localId === localId) ?? null;
  }

  async createPolicyIfMissing(policy: LocalPolicy): Promise<LocalPolicy> {
    const existing = await this.findPolicy(policy.localId);
    if (existing) return existing;
    this.put(policy);
    return policy;
  }

  async upsertPolicy(policy: LocalPolicy): Promise<LocalPolicy> {
    const existing = await this.findPolicy(policy.localId);
    if (existing && existing.id !== policy.id) this.items.delete(existing.id);
    this.put(policy);
    return policy;
  }

  async listOrderWindows(localId: string): Promise<LocalOrderWindow[]> {
    return [...(this.windowsByLocal.get(localId) ?? [])].sort(
      (left, right) => left.dayOfWeek - right.dayOfWeek || left.startsAt.localeCompare(right.startsAt),
    );
  }

  async replaceOrderWindows(
    localId: string,
    windows: LocalOrderWindow[],
    _tx?: unknown,
  ): Promise<LocalOrderWindow[]> {
    this.windowsByLocal.set(localId, [...windows]);
    return this.listOrderWindows(localId);
  }
}
