import type { MenuProduct } from '../../../../modules/menu/domain/entities/menu-product.entity';
import { MenuPriceNotFoundError } from '../../../../modules/menu/domain/errors/menu.errors';
import type { MenuProductRepository } from '../../../../modules/menu/domain/ports/menu-product.repository';
import type { MenuPrice } from '../../../../modules/menu/domain/value-objects/menu-price.value-object';
import { InMemoryRepository } from '../in-memory.repository';

export class InMemoryMenuProductRepository
  extends InMemoryRepository<MenuProduct>
  implements MenuProductRepository
{
  private readonly prices = new Map<string, MenuPrice[]>();

  seed(product: MenuProduct, prices: MenuPrice[] = [product.currentPrice]): void {
    this.put(product);
    this.prices.set(product.id, [...prices]);
    const current = prices.find((price) => price.validTo === null);
    if (current) product.setCurrentPrice(current);
  }

  pricesFor(productId: string): readonly MenuPrice[] {
    return [...(this.prices.get(productId) ?? [])];
  }

  async listByLocal(localId: string, _companyId: string | null): Promise<MenuProduct[]> {
    return this.values().filter((product) => product.localId === localId);
  }

  async findById(id: string): Promise<MenuProduct | null> {
    return this.getById(id);
  }

  async create(product: MenuProduct, _tx?: unknown): Promise<MenuProduct> {
    this.put(product);
    this.prices.set(product.id, []);
    return product;
  }

  async update(product: MenuProduct): Promise<MenuProduct> {
    this.put(product);
    return product;
  }

  async findCurrentPrice(productId: string, _tx?: unknown): Promise<MenuPrice | null> {
    return this.prices.get(productId)?.find((price) => price.validTo === null) ?? null;
  }

  async closeCurrentPrice(
    productId: string,
    validTo: Date,
    _tx?: unknown,
  ): Promise<MenuPrice> {
    const current = await this.findCurrentPrice(productId);
    if (!current) throw new MenuPriceNotFoundError();
    current.close(validTo);
    return current;
  }

  async createPrice(price: MenuPrice, _tx?: unknown): Promise<MenuPrice> {
    const prices = this.prices.get(price.productId) ?? [];
    prices.push(price);
    this.prices.set(price.productId, prices);
    this.getById(price.productId)?.setCurrentPrice(price);
    return price;
  }
}
