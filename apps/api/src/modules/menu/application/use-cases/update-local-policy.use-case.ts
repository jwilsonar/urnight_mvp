import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UpdateLocalPolicyDto } from '@urnight/contracts';
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
export class UpdateLocalPolicyUseCase {
  constructor(
    @Inject(LOCAL_POLICY_REPOSITORY) private readonly policies: LocalPolicyRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    dto: UpdateLocalPolicyDto;
    scope: TenantScope;
  }): Promise<LocalPolicy> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const existing = await this.policies.findPolicy(input.localId);
    const policy =
      existing ??
      LocalPolicy.create({
        id: randomUUID(),
        localId: input.localId,
        reservationDepositPercent: 0,
        birthdayWindowDays: 1,
      });
    policy.update(input.dto);
    return this.policies.upsertPolicy(policy);
  }
}
