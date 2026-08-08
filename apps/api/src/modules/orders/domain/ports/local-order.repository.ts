import type { LocalOrder } from '../entities/local-order.entity';

export interface LocalOrderRepository {
  create(order: LocalOrder, tx?: unknown): Promise<LocalOrder>;
  save(order: LocalOrder, tx?: unknown): Promise<LocalOrder>;
  findById(id: string, tx?: unknown, lock?: boolean): Promise<LocalOrder | null>;
  findMine(id: string, userId: string, tx?: unknown): Promise<LocalOrder | null>;
  listByLocal(localId: string): Promise<LocalOrder[]>;
  isOpenPickupCode(localId: string, pickupCode: string, tx?: unknown): Promise<boolean>;
}

export const LOCAL_ORDER_REPOSITORY = Symbol('LOCAL_ORDER_REPOSITORY');
