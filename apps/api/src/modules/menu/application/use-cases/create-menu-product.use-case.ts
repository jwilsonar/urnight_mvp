import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateMenuProductDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { MenuProduct } from '../../domain/entities/menu-product.entity';
import { MenuCategoryNotFoundError } from '../../domain/errors/menu.errors';
import {
  MENU_CATEGORY_REPOSITORY,
  type MenuCategoryRepository,
} from '../../domain/ports/menu-category.repository';
import {
  MENU_PRODUCT_REPOSITORY,
  type MenuProductRepository,
} from '../../domain/ports/menu-product.repository';
import { MenuPrice } from '../../domain/value-objects/menu-price.value-object';
import { assertMenuLocalTenant } from '../menu-tenant-access';

@Injectable()
export class CreateMenuProductUseCase {
  private readonly log = createLogger(CreateMenuProductUseCase.name);

  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY) private readonly products: MenuProductRepository,
    @Inject(MENU_CATEGORY_REPOSITORY) private readonly categories: MenuCategoryRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    localId: string;
    dto: CreateMenuProductDto;
    scope: TenantScope;
  }): Promise<MenuProduct> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const category = await this.categories.findById(input.dto.categoryId);
    if (!category || category.localId !== input.localId) throw new MenuCategoryNotFoundError();

    const productId = randomUUID();
    const now = new Date();
    const currentPrice = MenuPrice.create({
      id: randomUUID(),
      productId,
      amount: input.dto.priceAmount,
      currency: input.dto.priceCurrency,
      validFrom: now,
    });
    const product = MenuProduct.create({
      id: productId,
      categoryId: input.dto.categoryId,
      localId: input.localId,
      name: input.dto.name,
      description: input.dto.description,
      imageKey: input.dto.imageKey,
      isAvailable: input.dto.isAvailable,
      tags: input.dto.tags,
      currentPrice,
      createdAt: now,
      updatedAt: now,
    });

    await this.uow.run(async (tx) => {
      await this.products.create(product, tx);
      await this.products.createPrice(currentPrice, tx);
    });
    this.log.info({ productId, localId: input.localId }, 'menu.product.created');
    return product;
  }
}
