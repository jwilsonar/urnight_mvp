import type { MenuCategory } from '../../../../modules/menu/domain/entities/menu-category.entity';
import type { MenuCategoryRepository } from '../../../../modules/menu/domain/ports/menu-category.repository';
import { InMemoryRepository } from '../in-memory.repository';

export class InMemoryMenuCategoryRepository
  extends InMemoryRepository<MenuCategory>
  implements MenuCategoryRepository
{
  seed(category: MenuCategory): void {
    this.put(category);
  }

  async listByLocal(localId: string, _companyId: string | null): Promise<MenuCategory[]> {
    return this.values()
      .filter((category) => category.localId === localId)
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  async findById(id: string): Promise<MenuCategory | null> {
    return this.getById(id);
  }

  async create(category: MenuCategory): Promise<MenuCategory> {
    this.put(category);
    return category;
  }

  async update(category: MenuCategory): Promise<MenuCategory> {
    this.put(category);
    return category;
  }
}
