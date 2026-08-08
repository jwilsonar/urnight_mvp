import type { LocalOrder } from '../../../../modules/orders/domain/entities/local-order.entity';
import type { LocalOrderRepository } from '../../../../modules/orders/domain/ports/local-order.repository';
import { InMemoryRepository } from '../in-memory.repository';

export class InMemoryLocalOrderRepository
  extends InMemoryRepository<LocalOrder>
  implements LocalOrderRepository
{
  seed(order: LocalOrder): void {
    this.put(order);
  }

  async create(order: LocalOrder, _tx?: unknown): Promise<LocalOrder> {
    this.put(order);
    return order;
  }

  async save(order: LocalOrder, _tx?: unknown): Promise<LocalOrder> {
    this.put(order);
    return order;
  }

  async findById(id: string, _tx?: unknown, _lock?: boolean): Promise<LocalOrder | null> {
    return this.getById(id);
  }

  async findMine(id: string, userId: string, _tx?: unknown): Promise<LocalOrder | null> {
    const order = this.getById(id);
    return order?.userId === userId ? order : null;
  }

  async listByLocal(localId: string): Promise<LocalOrder[]> {
    return this.values().filter((order) => order.localId === localId);
  }

  async isOpenPickupCode(localId: string, pickupCode: string): Promise<boolean> {
    return this.values().some(
      (order) =>
        order.localId === localId &&
        order.pickupCode === pickupCode &&
        ['received', 'preparing', 'ready'].includes(order.status),
    );
  }
}
