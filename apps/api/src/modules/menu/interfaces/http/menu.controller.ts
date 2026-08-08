import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  changeMenuProductPriceSchema,
  createMenuCategorySchema,
  createMenuProductSchema,
  renameMenuCategorySchema,
  reorderMenuCategorySchema,
  replaceLocalOrderWindowsSchema,
  setMenuProductAvailabilitySchema,
  updateLocalPolicySchema,
  updateMenuProductSchema,
  type ChangeMenuProductPriceDto,
  type CreateMenuCategoryDto,
  type CreateMenuProductDto,
  type LocalOrderWindowResponse,
  type LocalPolicyResponse,
  type MenuCategoryResponse,
  type MenuPriceChangeResponse,
  type MenuProductResponse,
  type RenameMenuCategoryDto,
  type ReorderMenuCategoryDto,
  type ReplaceLocalOrderWindowsDto,
  type SetMenuProductAvailabilityDto,
  type UpdateLocalPolicyDto,
  type UpdateMenuProductDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import type { TenantScope } from '../../../../shared/tenant/tenant-scope';
import {
  ChangeMenuProductPriceUseCase,
  type MenuPriceChangeResult,
} from '../../application/use-cases/change-menu-product-price.use-case';
import { CreateMenuCategoryUseCase } from '../../application/use-cases/create-menu-category.use-case';
import { CreateMenuProductUseCase } from '../../application/use-cases/create-menu-product.use-case';
import { GetLocalOrderWindowsUseCase } from '../../application/use-cases/get-local-order-windows.use-case';
import { GetLocalPolicyUseCase } from '../../application/use-cases/get-local-policy.use-case';
import { GetMenuProductUseCase } from '../../application/use-cases/get-menu-product.use-case';
import { ListMenuCategoriesUseCase } from '../../application/use-cases/list-menu-categories.use-case';
import { ListMenuProductsUseCase } from '../../application/use-cases/list-menu-products.use-case';
import { RenameMenuCategoryUseCase } from '../../application/use-cases/rename-menu-category.use-case';
import { ReorderMenuCategoryUseCase } from '../../application/use-cases/reorder-menu-category.use-case';
import { ReplaceLocalOrderWindowsUseCase } from '../../application/use-cases/replace-local-order-windows.use-case';
import { SetMenuProductAvailabilityUseCase } from '../../application/use-cases/set-menu-product-availability.use-case';
import { UpdateLocalPolicyUseCase } from '../../application/use-cases/update-local-policy.use-case';
import { UpdateMenuProductUseCase } from '../../application/use-cases/update-menu-product.use-case';
import type { LocalOrderWindow } from '../../domain/entities/local-order-window.entity';
import type { LocalPolicy } from '../../domain/entities/local-policy.entity';
import type { MenuCategory } from '../../domain/entities/menu-category.entity';
import type { MenuProduct } from '../../domain/entities/menu-product.entity';

/** Lectura global deliberada para la carta pública; el local concreto sí se valida. */
const PUBLIC_MENU_SCOPE: TenantScope = { isSuperAdmin: true, companyId: null };

@Controller('locals/:localId/menu')
export class MenuController {
  constructor(
    private readonly listCategories: ListMenuCategoriesUseCase,
    private readonly createCategory: CreateMenuCategoryUseCase,
    private readonly renameCategory: RenameMenuCategoryUseCase,
    private readonly reorderCategory: ReorderMenuCategoryUseCase,
    private readonly listProducts: ListMenuProductsUseCase,
    private readonly getProduct: GetMenuProductUseCase,
    private readonly createProduct: CreateMenuProductUseCase,
    private readonly updateProduct: UpdateMenuProductUseCase,
    private readonly setAvailability: SetMenuProductAvailabilityUseCase,
    private readonly changePrice: ChangeMenuProductPriceUseCase,
    private readonly getPolicy: GetLocalPolicyUseCase,
    private readonly updatePolicy: UpdateLocalPolicyUseCase,
    private readonly getOrderWindows: GetLocalOrderWindowsUseCase,
    private readonly replaceOrderWindows: ReplaceLocalOrderWindowsUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Public()
  @Get('categories')
  async categories(
    @Param('localId', ParseUUIDPipe) localId: string,
  ): Promise<MenuCategoryResponse[]> {
    return (
      await this.listCategories.execute({ localId, scope: PUBLIC_MENU_SCOPE })
    ).map(toCategoryResponse);
  }

  @Roles('admin_local', 'super_admin')
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async addCategory(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(createMenuCategorySchema)) dto: CreateMenuCategoryDto,
  ): Promise<MenuCategoryResponse> {
    return toCategoryResponse(
      await this.createCategory.execute({ localId, dto, scope: tenantScopeOf(actor) }),
    );
  }

  @Roles('admin_local', 'super_admin')
  @Patch('categories/:categoryId/name')
  async changeCategoryName(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(renameMenuCategorySchema)) dto: RenameMenuCategoryDto,
  ): Promise<MenuCategoryResponse> {
    return toCategoryResponse(
      await this.renameCategory.execute({
        localId,
        categoryId,
        name: dto.name,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Roles('admin_local', 'super_admin')
  @Patch('categories/:categoryId/order')
  async changeCategoryOrder(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(reorderMenuCategorySchema)) dto: ReorderMenuCategoryDto,
  ): Promise<MenuCategoryResponse> {
    return toCategoryResponse(
      await this.reorderCategory.execute({
        localId,
        categoryId,
        displayOrder: dto.displayOrder,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Public()
  @Get('products')
  async products(
    @Param('localId', ParseUUIDPipe) localId: string,
  ): Promise<MenuProductResponse[]> {
    return (
      await this.listProducts.execute({ localId, scope: PUBLIC_MENU_SCOPE })
    ).map((product) => toProductResponse(product, this.storage));
  }

  @Public()
  @Get('products/:productId')
  async product(
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<MenuProductResponse> {
    return toProductResponse(
      await this.getProduct.execute({ localId, productId, scope: PUBLIC_MENU_SCOPE }),
      this.storage,
    );
  }

  @Roles('admin_local', 'super_admin')
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  async addProduct(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(createMenuProductSchema)) dto: CreateMenuProductDto,
  ): Promise<MenuProductResponse> {
    return toProductResponse(
      await this.createProduct.execute({ localId, dto, scope: tenantScopeOf(actor) }),
      this.storage,
    );
  }

  @Roles('admin_local', 'super_admin')
  @Patch('products/:productId')
  async editProduct(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(updateMenuProductSchema)) dto: UpdateMenuProductDto,
  ): Promise<MenuProductResponse> {
    return toProductResponse(
      await this.updateProduct.execute({
        localId,
        productId,
        dto,
        scope: tenantScopeOf(actor),
      }),
      this.storage,
    );
  }

  @Roles('admin_local', 'super_admin')
  @Patch('products/:productId/availability')
  async changeAvailability(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(setMenuProductAvailabilitySchema))
    dto: SetMenuProductAvailabilityDto,
  ): Promise<MenuProductResponse> {
    return toProductResponse(
      await this.setAvailability.execute({
        localId,
        productId,
        isAvailable: dto.isAvailable,
        scope: tenantScopeOf(actor),
      }),
      this.storage,
    );
  }

  @Roles('admin_local', 'super_admin')
  @Post('products/:productId/prices')
  async setPrice(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(changeMenuProductPriceSchema)) dto: ChangeMenuProductPriceDto,
  ): Promise<MenuPriceChangeResponse> {
    return toPriceChangeResponse(
      await this.changePrice.execute({
        localId,
        productId,
        dto,
        scope: tenantScopeOf(actor),
      }),
    );
  }

  @Roles('admin_local', 'super_admin')
  @Get('policy')
  async policy(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
  ): Promise<LocalPolicyResponse> {
    return toPolicyResponse(
      await this.getPolicy.execute({ localId, scope: tenantScopeOf(actor) }),
    );
  }

  @Roles('admin_local', 'super_admin')
  @Put('policy')
  async editPolicy(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(updateLocalPolicySchema)) dto: UpdateLocalPolicyDto,
  ): Promise<LocalPolicyResponse> {
    return toPolicyResponse(
      await this.updatePolicy.execute({ localId, dto, scope: tenantScopeOf(actor) }),
    );
  }

  @Public()
  @Get('order-windows')
  async orderWindows(
    @Param('localId', ParseUUIDPipe) localId: string,
  ): Promise<LocalOrderWindowResponse[]> {
    return (
      await this.getOrderWindows.execute({ localId, scope: PUBLIC_MENU_SCOPE })
    ).map(toOrderWindowResponse);
  }

  @Roles('admin_local', 'super_admin')
  @Put('order-windows')
  async editOrderWindows(
    @CurrentUser() actor: AuthUser,
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body(new ZodValidationPipe(replaceLocalOrderWindowsSchema))
    dto: ReplaceLocalOrderWindowsDto,
  ): Promise<LocalOrderWindowResponse[]> {
    return (
      await this.replaceOrderWindows.execute({
        localId,
        dto,
        scope: tenantScopeOf(actor),
      })
    ).map(toOrderWindowResponse);
  }
}

export function toCategoryResponse(category: MenuCategory): MenuCategoryResponse {
  return {
    id: category.id,
    localId: category.localId,
    name: category.name,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toProductResponse(
  product: MenuProduct,
  storage: Pick<StoragePort, 'resolveUrl'>,
): MenuProductResponse {
  return {
    id: product.id,
    categoryId: product.categoryId,
    localId: product.localId,
    name: product.name,
    description: product.description,
    imageUrl: product.imageKey ? storage.resolveUrl(product.imageKey) : null,
    isAvailable: product.isAvailable,
    tags: product.tags,
    priceAmount: product.currentPrice.amount,
    priceCurrency: product.currentPrice.currency,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toPriceChangeResponse(result: MenuPriceChangeResult): MenuPriceChangeResponse {
  return {
    productId: result.productId,
    previous: { amount: result.previous.amount, currency: result.previous.currency },
    current: { amount: result.current.amount, currency: result.current.currency },
  };
}

export function toPolicyResponse(policy: LocalPolicy): LocalPolicyResponse {
  return {
    id: policy.id,
    localId: policy.localId,
    reservationDepositPercent: policy.reservationDepositPercent,
    birthdayWindowDays: policy.birthdayWindowDays,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

export function toOrderWindowResponse(window: LocalOrderWindow): LocalOrderWindowResponse {
  return {
    id: window.id,
    localId: window.localId,
    dayOfWeek: window.dayOfWeek,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
  };
}
