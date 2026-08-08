import {
  LocalOrderSplit,
  type LocalOrderSplitPayment,
} from '../../../../modules/orders/domain/entities/local-order-split.entity';
import type { LocalOrderSplitRepository } from '../../../../modules/orders/domain/ports/local-order-split.repository';
import { InMemoryRepository } from '../in-memory.repository';

export class InMemoryLocalOrderSplitRepository
  extends InMemoryRepository<LocalOrderSplit>
  implements LocalOrderSplitRepository
{
  seed(split: LocalOrderSplit): void {
    this.put(clone(split));
  }

  async create(split: LocalOrderSplit): Promise<LocalOrderSplit> {
    this.put(clone(split));
    return split;
  }

  async findByOrderId(orderId: string): Promise<LocalOrderSplit | null> {
    const split = this.values().find((item) => item.orderId === orderId);
    return split ? clone(split) : null;
  }

  async findByToken(shareToken: string): Promise<LocalOrderSplit | null> {
    const split = this.values().find((item) => item.shareToken === shareToken);
    return split ? clone(split) : null;
  }

  async addPayment(payment: LocalOrderSplitPayment): Promise<LocalOrderSplitPayment> {
    const split = this.getById(payment.splitId);
    split?.addPayment(payment);
    return payment;
  }
}

function clone(split: LocalOrderSplit): LocalOrderSplit {
  return LocalOrderSplit.fromPersistence({
    id: split.id,
    orderId: split.orderId,
    shareToken: split.shareToken,
    expectedTotal: split.expectedTotal,
    payments: [...split.payments],
    createdAt: split.createdAt,
    updatedAt: split.updatedAt,
  });
}
