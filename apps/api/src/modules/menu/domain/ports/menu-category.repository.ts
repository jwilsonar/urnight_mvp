import type { MenuCategory } from '../entities/menu-category.entity';

export interface MenuCategoryRepository {
  listByLocal(localId: string, companyId: string | null): Promise<MenuCategory[]>;
  findById(id: string): Promise<MenuCategory | null>;
  create(category: MenuCategory): Promise<MenuCategory>;
  update(category: MenuCategory): Promise<MenuCategory>;
}

export const MENU_CATEGORY_REPOSITORY = Symbol('MENU_CATEGORY_REPOSITORY');
