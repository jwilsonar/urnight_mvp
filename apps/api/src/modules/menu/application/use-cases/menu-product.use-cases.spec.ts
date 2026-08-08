import { describe, expect, it } from 'vitest';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import { FakeResourceTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import {
  InMemoryMenuCategoryRepository,
  InMemoryMenuProductRepository,
} from '../../../../shared/testing/in-memory/menu';
import { MenuCategory } from '../../domain/entities/menu-category.entity';
import { MenuProduct } from '../../domain/entities/menu-product.entity';
import { MenuPrice } from '../../domain/value-objects/menu-price.value-object';
import { ChangeMenuProductPriceUseCase } from './change-menu-product-price.use-case';
import { CreateMenuProductUseCase } from './create-menu-product.use-case';
import { GetMenuProductUseCase } from './get-menu-product.use-case';
import { ListMenuProductsUseCase } from './list-menu-products.use-case';
import { SetMenuProductAvailabilityUseCase } from './set-menu-product-availability.use-case';
import { UpdateMenuProductUseCase } from './update-menu-product.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';
const CATEGORY_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCT_ID = '33333333-3333-3333-3333-333333333333';

function price(id: string, amount: number, validFrom: Date, validTo: Date | null = null) {
  return MenuPrice.fromPersistence({
    id,
    productId: PRODUCT_ID,
    amount,
    currency: 'PEN',
    validFrom,
    validTo,
  });
}

function product(currentPrice = price('price-current', 35, new Date('2026-01-02T00:00:00Z'))) {
  return MenuProduct.create({
    id: PRODUCT_ID,
    categoryId: CATEGORY_ID,
    localId: LOCAL_ID,
    name: 'Chilcano clásico',
    description: 'Pisco, ginger ale y limón',
    imageKey: 'menu/chilcano.webp',
    tags: ['coctel'],
    currentPrice,
  });
}

function build() {
  const categories = new InMemoryMenuCategoryRepository();
  const products = new InMemoryMenuProductRepository();
  const tenant = new FakeResourceTenant('company-a');
  const uow = fakeUnitOfWork();
  categories.seed(
    MenuCategory.create({
      id: CATEGORY_ID,
      localId: LOCAL_ID,
      name: 'Bebidas',
      displayOrder: 1,
    }),
  );
  return {
    categories,
    products,
    list: new ListMenuProductsUseCase(products, tenant),
    get: new GetMenuProductUseCase(products, tenant),
    create: new CreateMenuProductUseCase(products, categories, tenant, uow),
    update: new UpdateMenuProductUseCase(products, categories, tenant),
    availability: new SetMenuProductAvailabilityUseCase(products, tenant),
    changePrice: new ChangeMenuProductPriceUseCase(products, tenant, uow),
  };
}

describe('casos de uso de productos de carta', () => {
  it('lista productos del local con su precio vigente', async () => {
    const { products, list } = build();
    products.seed(product());

    const result = await list.execute({ localId: LOCAL_ID, scope: SUPER_ADMIN_SCOPE });

    expect(result).toHaveLength(1);
    expect(result[0]?.currentPrice.amount).toBe(35);
  });

  it('leer un producto devuelve el precio vigente y no uno histórico', async () => {
    const { products, get } = build();
    const historical = price(
      'price-old',
      25,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-02T00:00:00Z'),
    );
    const current = price('price-current', 35, new Date('2026-01-02T00:00:00Z'));
    products.seed(product(current), [historical, current]);

    const result = await get.execute({
      localId: LOCAL_ID,
      productId: PRODUCT_ID,
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.currentPrice.amount).toBe(35);
    expect(result.currentPrice.validTo).toBeNull();
  });

  it('crea producto y su precio inicial en la misma unidad de trabajo', async () => {
    const { create, products } = build();

    const result = await create.execute({
      localId: LOCAL_ID,
      dto: {
        categoryId: CATEGORY_ID,
        name: 'Agua mineral',
        tags: ['sin-alcohol'],
        priceAmount: 8,
        priceCurrency: 'PEN',
      },
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.currentPrice.amount).toBe(8);
    expect(products.pricesFor(result.id)).toHaveLength(1);
  });

  it('edita los datos del producto sin alterar su precio', async () => {
    const { products, update } = build();
    products.seed(product());

    const result = await update.execute({
      localId: LOCAL_ID,
      productId: PRODUCT_ID,
      dto: { name: 'Chilcano de la casa', tags: ['coctel', 'recomendado'] },
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.name).toBe('Chilcano de la casa');
    expect(result.tags).toEqual(['coctel', 'recomendado']);
    expect(result.currentPrice.amount).toBe(35);
  });

  it('cambia la disponibilidad del producto', async () => {
    const { products, availability } = build();
    products.seed(product());

    const result = await availability.execute({
      localId: LOCAL_ID,
      productId: PRODUCT_ID,
      isAvailable: false,
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.isAvailable).toBe(false);
  });

  it('cambiar precio cierra el anterior y deja exactamente uno vigente', async () => {
    const { products, changePrice } = build();
    products.seed(product());

    const result = await changePrice.execute({
      localId: LOCAL_ID,
      productId: PRODUCT_ID,
      dto: { amount: 42, currency: 'PEN' },
      scope: SUPER_ADMIN_SCOPE,
    });

    const prices = products.pricesFor(PRODUCT_ID);
    expect(result.previous.amount).toBe(35);
    expect(result.current.amount).toBe(42);
    expect(prices.filter((item) => item.validTo === null)).toHaveLength(1);
    expect(prices.find((item) => item.id === 'price-current')?.validTo).toBeInstanceOf(Date);
  });
});
