import { describe, expect, it } from 'vitest';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import {
  FakeResourceTenant,
  SUPER_ADMIN_SCOPE,
  scopeForCompany,
} from '../../../../shared/testing/fakes';
import { InMemoryMenuCategoryRepository } from '../../../../shared/testing/in-memory/menu';
import { MenuCategory } from '../../domain/entities/menu-category.entity';
import { CreateMenuCategoryUseCase } from './create-menu-category.use-case';
import { ListMenuCategoriesUseCase } from './list-menu-categories.use-case';
import { RenameMenuCategoryUseCase } from './rename-menu-category.use-case';
import { ReorderMenuCategoryUseCase } from './reorder-menu-category.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';

function build(companyId = 'company-a') {
  const categories = new InMemoryMenuCategoryRepository();
  const tenant = new FakeResourceTenant(companyId);
  return {
    categories,
    list: new ListMenuCategoriesUseCase(categories, tenant),
    create: new CreateMenuCategoryUseCase(categories, tenant),
    rename: new RenameMenuCategoryUseCase(categories, tenant),
    reorder: new ReorderMenuCategoryUseCase(categories, tenant),
  };
}

function category(id: string, name: string, displayOrder: number) {
  return MenuCategory.create({ id, localId: LOCAL_ID, name, displayOrder });
}

describe('casos de uso de categorías de carta', () => {
  it('lista las categorías del local en displayOrder', async () => {
    const { categories, list } = build();
    categories.seed(category('category-b', 'Fondos', 2));
    categories.seed(category('category-a', 'Entradas', 1));

    const result = await list.execute({ localId: LOCAL_ID, scope: SUPER_ADMIN_SCOPE });

    expect(result.map((item) => item.name)).toEqual(['Entradas', 'Fondos']);
  });

  it('crea una categoría dentro del tenant del admin_local', async () => {
    const { categories, create } = build();

    const result = await create.execute({
      localId: LOCAL_ID,
      dto: { name: 'Bebidas', displayOrder: 3 },
      scope: scopeForCompany('company-a'),
    });

    expect(result.localId).toBe(LOCAL_ID);
    expect(result.name).toBe('Bebidas');
    expect(categories.size).toBe(1);
  });

  it('admin_local de otra empresa recibe TenantForbiddenError', async () => {
    const { create } = build('company-b');

    await expect(
      create.execute({
        localId: LOCAL_ID,
        dto: { name: 'Bebidas', displayOrder: 0 },
        scope: scopeForCompany('company-a'),
      }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });

  it('renombra una categoría del local', async () => {
    const { categories, rename } = build();
    categories.seed(category('category-a', 'Cocteles', 1));

    const result = await rename.execute({
      localId: LOCAL_ID,
      categoryId: 'category-a',
      name: 'Cócteles de autor',
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.name).toBe('Cócteles de autor');
  });

  it('reordena una categoría sin cambiar su identidad', async () => {
    const { categories, reorder } = build();
    categories.seed(category('category-a', 'Bebidas', 4));

    const result = await reorder.execute({
      localId: LOCAL_ID,
      categoryId: 'category-a',
      displayOrder: 1,
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.id).toBe('category-a');
    expect(result.displayOrder).toBe(1);
  });
});
