import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { MenuCategory } from '../../domain/entities/menu-category.entity';
import { MenuCategoryNotFoundError } from '../../domain/errors/menu.errors';
import {
  MENU_CATEGORY_REPOSITORY,
  type MenuCategoryRepository,
} from '../../domain/ports/menu-category.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class ReorderMenuCategoryUseCase {
  constructor(
    @Inject(MENU_CATEGORY_REPOSITORY) private readonly categories: MenuCategoryRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    categoryId: string;
    displayOrder: number;
    scope: TenantScope;
  }): Promise<MenuCategory> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const category = await this.categories.findById(input.categoryId);
    if (!category || category.localId !== input.localId) throw new MenuCategoryNotFoundError();
    category.reorder(input.displayOrder);
    return this.categories.update(category);
  }
}
