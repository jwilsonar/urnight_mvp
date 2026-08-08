import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  localOrderSplit as localOrderSplitTable,
  localOrderSplitPayment as localOrderSplitPaymentTable,
  type LocalOrderSplitRow,
} from '@urnight/db';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import {
  LocalOrderSplit,
  LocalOrderSplitPayment,
} from '../../domain/entities/local-order-split.entity';
import type { LocalOrderSplitRepository } from '../../domain/ports/local-order-split.repository';

@Injectable()
export class DrizzleLocalOrderSplitRepository implements LocalOrderSplitRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(split: LocalOrderSplit, tx?: unknown): Promise<LocalOrderSplit> {
    await this.exec(tx).insert(localOrderSplitTable).values({
      id: split.id,
      orderId: split.orderId,
      shareToken: split.shareToken,
      expectedTotal: split.expectedTotal.toFixed(2),
      createdAt: split.createdAt,
      updatedAt: split.updatedAt,
    });
    return split;
  }

  async findByOrderId(orderId: string, tx?: unknown): Promise<LocalOrderSplit | null> {
    const exec = this.exec(tx);
    const [row] = await exec
      .select()
      .from(localOrderSplitTable)
      .where(eq(localOrderSplitTable.orderId, orderId))
      .limit(1);
    return row ? this.toDomain(row, exec) : null;
  }

  async findByToken(
    shareToken: string,
    tx?: unknown,
    lock = false,
  ): Promise<LocalOrderSplit | null> {
    const exec = this.exec(tx);
    const query = exec
      .select()
      .from(localOrderSplitTable)
      .where(eq(localOrderSplitTable.shareToken, shareToken))
      .limit(1);
    const rows = lock ? await query.for('update') : await query;
    const row = rows[0];
    return row ? this.toDomain(row, exec) : null;
  }

  async addPayment(
    payment: LocalOrderSplitPayment,
    tx?: unknown,
  ): Promise<LocalOrderSplitPayment> {
    await this.exec(tx).insert(localOrderSplitPaymentTable).values({
      id: payment.id,
      splitId: payment.splitId,
      payerName: payment.payerName,
      amount: payment.amount.toFixed(2),
      paidAt: payment.paidAt,
    });
    return payment;
  }

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  private async toDomain(
    row: LocalOrderSplitRow,
    exec: DrizzleDb | Tx,
  ): Promise<LocalOrderSplit> {
    const payments = await exec
      .select()
      .from(localOrderSplitPaymentTable)
      .where(eq(localOrderSplitPaymentTable.splitId, row.id))
      .orderBy(
        asc(localOrderSplitPaymentTable.paidAt),
        asc(localOrderSplitPaymentTable.id),
      );
    return LocalOrderSplit.fromPersistence({
      id: row.id,
      orderId: row.orderId,
      shareToken: row.shareToken,
      expectedTotal: Number(row.expectedTotal),
      payments: payments.map((payment) =>
        LocalOrderSplitPayment.fromPersistence({
          id: payment.id,
          splitId: payment.splitId,
          payerName: payment.payerName,
          amount: Number(payment.amount),
          paidAt: payment.paidAt,
        }),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
