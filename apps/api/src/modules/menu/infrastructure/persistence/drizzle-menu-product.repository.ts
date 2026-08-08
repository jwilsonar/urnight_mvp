import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  local,
  menuCategory,
  menuProduct,
  menuProductPrice,
} from '@urnight/db';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { MenuProduct } from '../../domain/entities/menu-product.entity';
import { MenuPriceNotFoundError } from '../../domain/errors/menu.errors';
import type { MenuProductRepository } from '../../domain/ports/menu-product.repository';
import { MenuPrice } from '../../domain/value-objects/menu-price.value-object';

type ProductRow = typeof menuProduct.$inferSelect;
type PriceRow = typeof menuProductPrice.$inferSelect;
type ProductProjection = {
  product: ProductRow;
  localId: string;
  price: PriceRow | null;
};

@Injectable()
export class DrizzleMenuProductRepository implements MenuProductRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async listByLocal(localId: string, companyId: string | null): Promise<MenuProduct[]> {
    const rows = await this.db
      .select({ product: menuProduct, localId: menuCategory.localId, price: menuProductPrice })
      .from(menuProduct)
      .innerJoin(menuCategory, eq(menuCategory.id, menuProduct.categoryId))
      .innerJoin(local, eq(local.id, menuCategory.localId))
      .leftJoin(
        menuProductPrice,
        and(
          eq(menuProductPrice.productId, menuProduct.id),
          isNull(menuProductPrice.validTo),
        ),
      )
      .where(
        companyId
          ? and(eq(menuCategory.localId, localId), eq(local.companyId, companyId))
          : eq(menuCategory.localId, localId),
      )
      .orderBy(asc(menuCategory.displayOrder), asc(menuProduct.name), asc(menuProduct.id));
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<MenuProduct | null> {
    const [row] = await this.db
      .select({ product: menuProduct, localId: menuCategory.localId, price: menuProductPrice })
      .from(menuProduct)
      .innerJoin(menuCategory, eq(menuCategory.id, menuProduct.categoryId))
      .leftJoin(
        menuProductPrice,
        and(
          eq(menuProductPrice.productId, menuProduct.id),
          isNull(menuProductPrice.validTo),
        ),
      )
      .where(eq(menuProduct.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(product: MenuProduct, tx?: unknown): Promise<MenuProduct> {
    const [row] = await this.exec(tx)
      .insert(menuProduct)
      .values({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        imageKey: product.imageKey,
        isAvailable: product.isAvailable,
        tags: product.tags,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el producto de carta.');
    return product;
  }

  async update(product: MenuProduct): Promise<MenuProduct> {
    const [row] = await this.db
      .update(menuProduct)
      .set({
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        imageKey: product.imageKey,
        isAvailable: product.isAvailable,
        tags: product.tags,
        updatedAt: product.updatedAt,
      })
      .where(eq(menuProduct.id, product.id))
      .returning({ id: menuProduct.id });
    if (!row) throw new Error('No se pudo actualizar el producto de carta.');
    return product;
  }

  async findCurrentPrice(productId: string, tx?: unknown): Promise<MenuPrice | null> {
    const [row] = await this.exec(tx)
      .select()
      .from(menuProductPrice)
      .where(
        and(
          eq(menuProductPrice.productId, productId),
          isNull(menuProductPrice.validTo),
        ),
      )
      .limit(1);
    return row ? this.priceToDomain(row) : null;
  }

  async closeCurrentPrice(productId: string, validTo: Date, tx?: unknown): Promise<MenuPrice> {
    const [row] = await this.exec(tx)
      .update(menuProductPrice)
      .set({ validTo, updatedAt: validTo })
      .where(
        and(
          eq(menuProductPrice.productId, productId),
          isNull(menuProductPrice.validTo),
        ),
      )
      .returning();
    if (!row) throw new MenuPriceNotFoundError();
    return this.priceToDomain(row);
  }

  async createPrice(price: MenuPrice, tx?: unknown): Promise<MenuPrice> {
    const [row] = await this.exec(tx)
      .insert(menuProductPrice)
      .values({
        id: price.id,
        productId: price.productId,
        amount: price.amount.toFixed(2),
        currency: price.currency,
        validFrom: price.validFrom,
        validTo: price.validTo,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el precio del producto.');
    return this.priceToDomain(row);
  }

  private toDomain(row: ProductProjection): MenuProduct {
    if (!row.price) throw new MenuPriceNotFoundError();
    return MenuProduct.fromPersistence({
      id: row.product.id,
      categoryId: row.product.categoryId,
      localId: row.localId,
      name: row.product.name,
      description: row.product.description,
      imageKey: row.product.imageKey,
      isAvailable: row.product.isAvailable,
      tags: row.product.tags,
      currentPrice: this.priceToDomain(row.price),
      createdAt: row.product.createdAt,
      updatedAt: row.product.updatedAt,
    });
  }

  private priceToDomain(row: PriceRow): MenuPrice {
    return MenuPrice.fromPersistence({
      id: row.id,
      productId: row.productId,
      amount: Number(row.amount),
      currency: row.currency,
      validFrom: row.validFrom,
      validTo: row.validTo,
    });
  }
}
