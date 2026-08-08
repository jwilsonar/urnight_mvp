import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateMenuCategoryDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import { MenuCategory } from '../../domain/entities/menu-category.entity';
import {
  MENU_CATEGORY_REPOSITORY,
  type MenuCategoryRepository,
} from '../../domain/ports/menu-category.repository';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class CreateMenuCategoryUseCase {
  private readonly log = createLogger(CreateMenuCategoryUseCase.name);

  constructor(
    @Inject(MENU_CATEGORY_REPOSITORY) private readonly categories: MenuCategoryRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    localId: string;
    dto: CreateMenuCategoryDto;
    scope: TenantScope;
  }): Promise<MenuCategory> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const category = MenuCategory.create({
      id: randomUUID(),
      localId: input.localId,
      name: input.dto.name,
      displayOrder: input.dto.displayOrder,
    });
    const created = await this.categories.create(category);
    this.log.info({ categoryId: created.id, localId: input.localId }, 'menu.category.created');
    return created;
  }
}
