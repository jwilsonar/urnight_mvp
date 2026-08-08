import { Module } from '@nestjs/common';
import { ChangeMenuProductPriceUseCase } from './application/use-cases/change-menu-product-price.use-case';
import { CreateMenuCategoryUseCase } from './application/use-cases/create-menu-category.use-case';
import { CreateMenuProductUseCase } from './application/use-cases/create-menu-product.use-case';
import { GetLocalOrderWindowsUseCase } from './application/use-cases/get-local-order-windows.use-case';
import { GetLocalPolicyUseCase } from './application/use-cases/get-local-policy.use-case';
import { GetMenuProductUseCase } from './application/use-cases/get-menu-product.use-case';
import { ListMenuCategoriesUseCase } from './application/use-cases/list-menu-categories.use-case';
import { ListMenuProductsUseCase } from './application/use-cases/list-menu-products.use-case';
import { RenameMenuCategoryUseCase } from './application/use-cases/rename-menu-category.use-case';
import { ReorderMenuCategoryUseCase } from './application/use-cases/reorder-menu-category.use-case';
import { ReplaceLocalOrderWindowsUseCase } from './application/use-cases/replace-local-order-windows.use-case';
import { SetMenuProductAvailabilityUseCase } from './application/use-cases/set-menu-product-availability.use-case';
import { UpdateLocalPolicyUseCase } from './application/use-cases/update-local-policy.use-case';
import { UpdateMenuProductUseCase } from './application/use-cases/update-menu-product.use-case';
import { LOCAL_POLICY_REPOSITORY } from './domain/ports/local-policy.repository';
import { MENU_CATEGORY_REPOSITORY } from './domain/ports/menu-category.repository';
import { MENU_PRODUCT_REPOSITORY } from './domain/ports/menu-product.repository';
import { DrizzleLocalPolicyRepository } from './infrastructure/persistence/drizzle-local-policy.repository';
import { DrizzleMenuCategoryRepository } from './infrastructure/persistence/drizzle-menu-category.repository';
import { DrizzleMenuProductRepository } from './infrastructure/persistence/drizzle-menu-product.repository';
import { MenuController } from './interfaces/http/menu.controller';

@Module({
  controllers: [MenuController],
  providers: [
    ListMenuCategoriesUseCase,
    CreateMenuCategoryUseCase,
    RenameMenuCategoryUseCase,
    ReorderMenuCategoryUseCase,
    ListMenuProductsUseCase,
    GetMenuProductUseCase,
    CreateMenuProductUseCase,
    UpdateMenuProductUseCase,
    SetMenuProductAvailabilityUseCase,
    ChangeMenuProductPriceUseCase,
    GetLocalPolicyUseCase,
    UpdateLocalPolicyUseCase,
    GetLocalOrderWindowsUseCase,
    ReplaceLocalOrderWindowsUseCase,
    { provide: MENU_CATEGORY_REPOSITORY, useClass: DrizzleMenuCategoryRepository },
    { provide: MENU_PRODUCT_REPOSITORY, useClass: DrizzleMenuProductRepository },
    { provide: LOCAL_POLICY_REPOSITORY, useClass: DrizzleLocalPolicyRepository },
  ],
})
export class MenuModule {}
