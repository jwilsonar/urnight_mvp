import type { Order } from '../../../../modules/ticketing/domain/entities/order.entity';
import type { OrderRepository } from '../../../../modules/ticketing/domain/ports/order.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** OrderRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryOrderRepository
  extends InMemoryRepository<Order>
  implements OrderRepository
{
  async create(order: Order, _tx?: unknown): Promise<Order> {
    this.put(order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.getById(id);
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.values().filter((o) => o.userId === userId);
  }

  async update(order: Order, _tx?: unknown): Promise<Order> {
    this.put(order);
    return order;
  }
}
