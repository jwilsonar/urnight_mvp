import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { MenuCategory } from '../../domain/entities/menu-category.entity';
import {
  MENU_CATEGORY_REPOSITORY,
  type MenuCategoryRepository,
} from '../../domain/ports/menu-category.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class ListMenuCategoriesUseCase {
  constructor(
    @Inject(MENU_CATEGORY_REPOSITORY) private readonly categories: MenuCategoryRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<MenuCategory[]> {
    const companyId = await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    return this.categories.listByLocal(input.localId, companyId);
  }
}
