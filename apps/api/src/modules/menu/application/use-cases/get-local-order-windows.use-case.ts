import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { LocalOrderWindow } from '../../domain/entities/local-order-window.entity';
import {
  LOCAL_POLICY_REPOSITORY,
  type LocalPolicyRepository,
} from '../../domain/ports/local-policy.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class GetLocalOrderWindowsUseCase {
  constructor(
    @Inject(LOCAL_POLICY_REPOSITORY) private readonly policies: LocalPolicyRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<LocalOrderWindow[]> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    return this.policies.listOrderWindows(input.localId);
  }
}
