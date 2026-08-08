import { Inject, Injectable } from '@nestjs/common';
import type { UpdateMenuProductDto } from '@urnight/contracts';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { MenuProduct } from '../../domain/entities/menu-product.entity';
import {
  MenuCategoryNotFoundError,
  MenuProductNotFoundError,
} from '../../domain/errors/menu.errors';
import {
  MENU_CATEGORY_REPOSITORY,
  type MenuCategoryRepository,
} from '../../domain/ports/menu-category.repository';
import {
  MENU_PRODUCT_REPOSITORY,
  type MenuProductRepository,
} from '../../domain/ports/menu-product.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class UpdateMenuProductUseCase {
  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY) private readonly products: MenuProductRepository,
    @Inject(MENU_CATEGORY_REPOSITORY) private readonly categories: MenuCategoryRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    productId: string;
    dto: UpdateMenuProductDto;
    scope: TenantScope;
  }): Promise<MenuProduct> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const product = await this.products.findById(input.productId);
    if (!product || product.localId !== input.localId) throw new MenuProductNotFoundError();
    if (input.dto.categoryId) {
      const category = await this.categories.findById(input.dto.categoryId);
      if (!category || category.localId !== input.localId) throw new MenuCategoryNotFoundError();
    }
    product.update(input.dto);
    return this.products.update(product);
  }
}
