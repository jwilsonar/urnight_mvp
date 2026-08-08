import type {
  OrderableProduct,
  OrdersCatalogPort,
  OrderWindow,
} from '../../../../modules/orders/domain/ports/orders-catalog.port';

export class InMemoryOrdersCatalog implements OrdersCatalogPort {
  private readonly products = new Map<string, OrderableProduct>();
  private readonly windows: OrderWindow[] = [];

  seedProduct(product: OrderableProduct): void {
    this.products.set(product.id, { ...product });
  }

  seedWindow(window: OrderWindow): void {
    this.windows.push({ ...window });
  }

  setAvailability(productId: string, isAvailable: boolean): void {
    const product = this.products.get(productId);
    if (product) this.products.set(productId, { ...product, isAvailable });
  }

  setPrice(productId: string, amount: number): void {
    const product = this.products.get(productId);
    if (product) this.products.set(productId, { ...product, amount });
  }

  async findProduct(productId: string): Promise<OrderableProduct | null> {
    const product = this.products.get(productId);
    return product ? { ...product } : null;
  }

  async listOrderWindows(localId: string): Promise<OrderWindow[]> {
    return this.windows
      .filter((window) => window.localId === localId)
      .map((window) => ({ ...window }));
  }
}
