import type {
  LocalOrderSplit,
  LocalOrderSplitPayment,
} from '../entities/local-order-split.entity';

export interface LocalOrderSplitRepository {
  create(split: LocalOrderSplit, tx?: unknown): Promise<LocalOrderSplit>;
  findByOrderId(orderId: string, tx?: unknown): Promise<LocalOrderSplit | null>;
  findByToken(
    shareToken: string,
    tx?: unknown,
    lock?: boolean,
  ): Promise<LocalOrderSplit | null>;
  addPayment(payment: LocalOrderSplitPayment, tx?: unknown): Promise<LocalOrderSplitPayment>;
}

export const LOCAL_ORDER_SPLIT_REPOSITORY = Symbol('LOCAL_ORDER_SPLIT_REPOSITORY');
