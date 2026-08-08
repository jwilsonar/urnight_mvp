import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import { LocalPolicy } from '../../domain/entities/local-policy.entity';
import {
  LOCAL_POLICY_REPOSITORY,
  type LocalPolicyRepository,
} from '../../domain/ports/local-policy.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class GetLocalPolicyUseCase {
  constructor(
    @Inject(LOCAL_POLICY_REPOSITORY) private readonly policies: LocalPolicyRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<LocalPolicy> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const existing = await this.policies.findPolicy(input.localId);
    if (existing) return existing;
    return this.policies.createPolicyIfMissing(
      LocalPolicy.create({
        id: randomUUID(),
        localId: input.localId,
        reservationDepositPercent: 0,
        birthdayWindowDays: 1,
      }),
    );
  }
}
