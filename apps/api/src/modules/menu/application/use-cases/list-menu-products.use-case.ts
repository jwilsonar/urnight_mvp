import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { MenuProduct } from '../../domain/entities/menu-product.entity';
import {
  MENU_PRODUCT_REPOSITORY,
  type MenuProductRepository,
} from '../../domain/ports/menu-product.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class ListMenuProductsUseCase {
  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY) private readonly products: MenuProductRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<MenuProduct[]> {
    const companyId = await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    return this.products.listByLocal(input.localId, companyId);
  }
}
