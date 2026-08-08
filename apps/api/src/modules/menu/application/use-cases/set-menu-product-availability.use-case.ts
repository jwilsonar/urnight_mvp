import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { MenuProduct } from '../../domain/entities/menu-product.entity';
import { MenuProductNotFoundError } from '../../domain/errors/menu.errors';
import {
  MENU_PRODUCT_REPOSITORY,
  type MenuProductRepository,
} from '../../domain/ports/menu-product.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class SetMenuProductAvailabilityUseCase {
  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY) private readonly products: MenuProductRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    productId: string;
    isAvailable: boolean;
    scope: TenantScope;
  }): Promise<MenuProduct> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const product = await this.products.findById(input.productId);
    if (!product || product.localId !== input.localId) throw new MenuProductNotFoundError();
    product.setAvailability(input.isAvailable);
    return this.products.update(product);
  }
}
