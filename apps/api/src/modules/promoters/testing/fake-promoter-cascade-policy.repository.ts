import type {
  PromoterCascadePolicy,
  PromoterCascadePolicyRepository,
  ScopedPromoterCascadePolicy,
} from '../domain/ports/promoter-cascade-policy.repository';

export class FakePromoterCascadePolicyRepository
  implements PromoterCascadePolicyRepository
{
  private readonly companiesByLocal = new Map<string, string>();
  private readonly policiesByLocal = new Map<string, PromoterCascadePolicy>();
  private readonly policiesByOrder = new Map<string, PromoterCascadePolicy>();

  seedLocal(localId: string, companyId: string): this {
    this.companiesByLocal.set(localId, companyId);
    return this;
  }

  seedForOrder(orderId: string, policy: PromoterCascadePolicy): this {
    this.policiesByOrder.set(orderId, policy);
    return this;
  }

  async findByLocalId(localId: string): Promise<ScopedPromoterCascadePolicy | null> {
    const companyId = this.companiesByLocal.get(localId);
    if (!companyId) return null;
    return {
      companyId,
      policy: this.policiesByLocal.get(localId) ?? {
        localId,
        cascadeEnabled: false,
        cascadePercentage: 0,
      },
    };
  }

  async findByOrderId(orderId: string): Promise<PromoterCascadePolicy | null> {
    return this.policiesByOrder.get(orderId) ?? null;
  }

  async upsert(policy: PromoterCascadePolicy): Promise<void> {
    this.policiesByLocal.set(policy.localId, policy);
  }
}
