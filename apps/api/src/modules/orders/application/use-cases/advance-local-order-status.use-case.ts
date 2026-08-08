import { Inject, Injectable } from '@nestjs/common';
// El tipo de rol sale de contratos, no del edge: la capa de aplicación no
// depende de la de entrada.
import type { LocalOrderStatus, RoleCode } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import {
  LocalOrderNotFoundError,
  OrderStatusAdvanceForbiddenError,
} from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';
import { assertOrdersLocalTenant } from '../orders-tenant-access';

@Injectable()
export class AdvanceLocalOrderStatusUseCase {
  private readonly log = createLogger(AdvanceLocalOrderStatusUseCase.name);

  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    orderId: string;
    localId: string;
    status: LocalOrderStatus;
    actorRoles: RoleCode[];
    scope: TenantScope;
    now?: Date;
  }): Promise<LocalOrder> {
    if (
      !input.actorRoles.includes('staff') &&
      !input.actorRoles.includes('super_admin')
    ) {
      throw new OrderStatusAdvanceForbiddenError();
    }

    await assertOrdersLocalTenant(input.localId, input.scope, this.tenant);
    const order = await this.orders.findById(input.orderId);
    if (!order || order.localId !== input.localId) throw new LocalOrderNotFoundError();
    const previousStatus = order.status;
    order.advanceTo(input.status, input.now);
    await this.orders.save(order);
    this.log.info(
      { orderId: order.id, localId: order.localId, previousStatus, status: order.status },
      'orders.order.status_changed',
    );
    return order;
  }
}
