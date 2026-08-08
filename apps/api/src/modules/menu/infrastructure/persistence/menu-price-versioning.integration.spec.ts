import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  company,
  local,
  menuProductPrice,
  type DbClient,
} from '@urnight/db';
import { asc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle.service';
import { DrizzleResourceTenantResolver } from '../../../../shared/tenant/drizzle-resource-tenant.adapter';
import { SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import {
  createTestDb,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import { DrizzleUnitOfWork } from '../../../../shared/unit-of-work/drizzle-unit-of-work';
import type { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { ChangeMenuProductPriceUseCase } from '../../application/use-cases/change-menu-product-price.use-case';
import { MenuCategory } from '../../domain/entities/menu-category.entity';
import { MenuProduct } from '../../domain/entities/menu-product.entity';
import type { MenuPrice } from '../../domain/value-objects/menu-price.value-object';
import { MenuPrice as MenuPriceValue } from '../../domain/value-objects/menu-price.value-object';
import { DrizzleMenuCategoryRepository } from './drizzle-menu-category.repository';
import { DrizzleMenuProductRepository } from './drizzle-menu-product.repository';

let client: DbClient;
let categories: DrizzleMenuCategoryRepository;
let products: DrizzleMenuProductRepository;
let tenant: DrizzleResourceTenantResolver;
let uow: UnitOfWork;

beforeAll(() => {
  client = createTestDb();
  categories = new DrizzleMenuCategoryRepository(client.db);
  products = new DrizzleMenuProductRepository(client.db);
  tenant = new DrizzleResourceTenantResolver(client.db);
  uow = new DrizzleUnitOfWork({ db: client.db } as DrizzleService);
});

afterEach(async () => {
  await truncateAll(client);
});

afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

async function seedProduct(): Promise<{ localId: string; productId: string }> {
  const companyId = randomUUID();
  const localId = randomUUID();
  const categoryId = randomUUID();
  const productId = randomUUID();
  const now = new Date('2026-01-01T00:00:00.000Z');

  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Carta Integration S.A.C.',
    ruc: '20999999991',
    commercialName: 'Carta Integration',
    status: 'active',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Integration',
    slug: `local-${localId}`,
    status: 'active',
  });
  await categories.create(
    MenuCategory.create({
      id: categoryId,
      localId,
      name: 'Bebidas',
      displayOrder: 1,
    }),
  );
  const currentPrice = MenuPriceValue.create({
    id: randomUUID(),
    productId,
    amount: 30,
    currency: 'PEN',
    validFrom: now,
  });
  const product = MenuProduct.create({
    id: productId,
    categoryId,
    localId,
    name: 'Chilcano',
    currentPrice,
    createdAt: now,
    updatedAt: now,
  });
  await uow.run(async (tx) => {
    await products.create(product, tx);
    await products.createPrice(currentPrice, tx);
  });
  return { localId, productId };
}

describe('versionado transaccional de precio (integration)', () => {
  it('cierra el precio anterior e inserta uno nuevo dejando exactamente un vigente', async () => {
    const { localId, productId } = await seedProduct();
    const useCase = new ChangeMenuProductPriceUseCase(products, tenant, uow);

    const result = await useCase.execute({
      localId,
      productId,
      dto: { amount: 45, currency: 'PEN' },
      scope: SUPER_ADMIN_SCOPE,
    });

    const rows = await client.db
      .select()
      .from(menuProductPrice)
      .where(eq(menuProductPrice.productId, productId))
      .orderBy(asc(menuProductPrice.validFrom));
    expect(result.previous.amount).toBe(30);
    expect(result.current.amount).toBe(45);
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.validTo === null)).toHaveLength(1);
    expect(rows[0]?.validTo).toBeInstanceOf(Date);
    expect(Number(rows[1]?.amount)).toBe(45);
  });

  it('revierte el cierre si falla la inserción del precio nuevo', async () => {
    const { localId, productId } = await seedProduct();
    class FailingPriceRepository extends DrizzleMenuProductRepository {
      override async createPrice(_price: MenuPrice, _tx?: unknown): Promise<MenuPrice> {
        throw new Error('fallo de inserción simulado');
      }
    }
    const failingProducts = new FailingPriceRepository(client.db);
    const useCase = new ChangeMenuProductPriceUseCase(failingProducts, tenant, uow);

    await expect(
      useCase.execute({
        localId,
        productId,
        dto: { amount: 45, currency: 'PEN' },
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toThrow('fallo de inserción simulado');

    const rows = await client.db
      .select()
      .from(menuProductPrice)
      .where(eq(menuProductPrice.productId, productId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.validTo).toBeNull();
    expect(Number(rows[0]?.amount)).toBe(30);
  });
});
