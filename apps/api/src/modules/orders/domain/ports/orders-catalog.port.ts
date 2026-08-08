export interface OrderableProduct {
  id: string;
  localId: string;
  isAvailable: boolean;
  amount: number;
  currency: string;
}

export interface OrderWindow {
  localId: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
}

export interface OrdersCatalogPort {
  findProduct(productId: string, tx?: unknown): Promise<OrderableProduct | null>;
  listOrderWindows(localId: string, tx?: unknown): Promise<OrderWindow[]>;
}

export const ORDERS_CATALOG_PORT = Symbol('ORDERS_CATALOG_PORT');
