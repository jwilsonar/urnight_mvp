import type { MenuProduct } from '../entities/menu-product.entity';
import type { MenuPrice } from '../value-objects/menu-price.value-object';

export interface MenuProductRepository {
  listByLocal(localId: string, companyId: string | null): Promise<MenuProduct[]>;
  findById(id: string): Promise<MenuProduct | null>;
  create(product: MenuProduct, tx?: unknown): Promise<MenuProduct>;
  update(product: MenuProduct): Promise<MenuProduct>;
  findCurrentPrice(productId: string, tx?: unknown): Promise<MenuPrice | null>;
  closeCurrentPrice(productId: string, validTo: Date, tx?: unknown): Promise<MenuPrice>;
  createPrice(price: MenuPrice, tx?: unknown): Promise<MenuPrice>;
}

export const MENU_PRODUCT_REPOSITORY = Symbol('MENU_PRODUCT_REPOSITORY');
