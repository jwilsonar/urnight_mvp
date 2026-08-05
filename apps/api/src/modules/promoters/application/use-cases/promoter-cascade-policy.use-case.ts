import { Inject, Injectable } from "@nestjs/common";
import {
  assertTenant,
  type TenantScope,
} from "../../../../shared/tenant/tenant-scope";
import { PromoterCascadePolicyLocalNotFoundError } from "../../domain/errors/promoters.errors";
import {
  PROMOTER_CASCADE_POLICY_REPOSITORY,
  type PromoterCascadePolicy,
  type PromoterCascadePolicyRepository,
} from "../../domain/ports/promoter-cascade-policy.repository";

@Injectable()
export class GetPromoterCascadePolicyUseCase {
  constructor(
    @Inject(PROMOTER_CASCADE_POLICY_REPOSITORY)
    private readonly policies: PromoterCascadePolicyRepository,
  ) {}

  async execute(input: {
    localId: string;
    scope: TenantScope;
  }): Promise<PromoterCascadePolicy> {
    const scoped = await this.policies.findByLocalId(input.localId);
    if (!scoped) throw new PromoterCascadePolicyLocalNotFoundError();
    assertTenant(input.scope, scoped.companyId);
    return scoped.policy;
  }
}

@Injectable()
export class UpdatePromoterCascadePolicyUseCase {
  constructor(
    @Inject(PROMOTER_CASCADE_POLICY_REPOSITORY)
    private readonly policies: PromoterCascadePolicyRepository,
  ) {}

  async execute(
    input: PromoterCascadePolicy & { scope: TenantScope },
  ): Promise<PromoterCascadePolicy> {
    const scoped = await this.policies.findByLocalId(input.localId);
    if (!scoped) throw new PromoterCascadePolicyLocalNotFoundError();
    assertTenant(input.scope, scoped.companyId);
    const policy = {
      localId: input.localId,
      cascadeEnabled: input.cascadeEnabled,
      cascadePercentage: input.cascadePercentage,
    };
    await this.policies.upsert(policy);
    return policy;
  }
}
