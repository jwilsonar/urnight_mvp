import type { Order } from '../entities/order.entity';

export interface OrderRepository {
  /** Inserta orden + order_items (en la Tx del checkout). */
  create(order: Order, tx?: unknown): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUser(userId: string): Promise<Order[]>;
  update(order: Order, tx?: unknown): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
