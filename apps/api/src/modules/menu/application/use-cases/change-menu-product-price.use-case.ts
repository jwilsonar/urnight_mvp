import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ChangeMenuProductPriceDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { MenuProductNotFoundError } from '../../domain/errors/menu.errors';
import {
  MENU_PRODUCT_REPOSITORY,
  type MenuProductRepository,
} from '../../domain/ports/menu-product.repository';
import { MenuPrice } from '../../domain/value-objects/menu-price.value-object';
import { assertMenuLocalTenant } from '../menu-tenant-access';

export interface MenuPriceChangeResult {
  productId: string;
  previous: MenuPrice;
  current: MenuPrice;
}

@Injectable()
export class ChangeMenuProductPriceUseCase {
  private readonly log = createLogger(ChangeMenuProductPriceUseCase.name);

  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY) private readonly products: MenuProductRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    localId: string;
    productId: string;
    dto: ChangeMenuProductPriceDto;
    scope: TenantScope;
  }): Promise<MenuPriceChangeResult> {
    await assertMenuLocalTenant(input.localId, input.scope, this.tenant);
    const product = await this.products.findById(input.productId);
    if (!product || product.localId !== input.localId) throw new MenuProductNotFoundError();

    const now = new Date();
    const current = MenuPrice.create({
      id: randomUUID(),
      productId: input.productId,
      amount: input.dto.amount,
      currency: input.dto.currency,
      validFrom: now,
    });
    const previous = await this.uow.run(async (tx) => {
      const closed = await this.products.closeCurrentPrice(input.productId, now, tx);
      await this.products.createPrice(current, tx);
      return closed;
    });

    this.log.info(
      { productId: input.productId, previousAmount: previous.amount, amount: current.amount },
      'menu.product.price_changed',
    );
    return { productId: input.productId, previous, current };
  }
}
