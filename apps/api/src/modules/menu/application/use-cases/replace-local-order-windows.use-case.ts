import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ReplaceLocalOrderWindowsDto } from '@urnight/contracts';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { LocalOrderWindow } from '../../domain/entities/local-order-window.entity';
import { MenuOrderWindowInvalidError } from '../../domain/errors/menu.errors';
import {
  LOCAL_POLICY_REPOSITORY,
  type LocalPolicyRepository,
} from '../../domain/ports/local-policy.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class ReplaceLocalOrderWindowsUseCase {
  constructor(
    @Inject(LOCAL_POLICY_REPOSITORY) private readonly policies: LocalPolicyRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    localId: string;
    dto: ReplaceLocalOrderWindowsDto;
    scope: TenantScope;
  }): Promise<LocalOrderWindow[]> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const signatures = new Set<string>();
    const windows = input.dto.windows.map((item) => {
      const signature = `${item.dayOfWeek}:${item.startsAt}:${item.endsAt}`;
      if (signatures.has(signature)) throw new MenuOrderWindowInvalidError();
      signatures.add(signature);
      return LocalOrderWindow.create({ id: randomUUID(), localId: input.localId, ...item });
    });
    return this.uow.run((tx) => this.policies.replaceOrderWindows(input.localId, windows, tx));
  }
}
