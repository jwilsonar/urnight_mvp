import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';
import { assertOrdersLocalTenant } from '../orders-tenant-access';

@Injectable()
export class ListLocalOrderQueueUseCase {
  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    scope: TenantScope;
  }): Promise<LocalOrder[]> {
    await assertOrdersLocalTenant(input.localId, input.scope, this.tenant);
    const orders = await this.orders.listByLocal(input.localId);
    return orders
      .filter((order) => ['received', 'preparing', 'ready'].includes(order.status))
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }
}
