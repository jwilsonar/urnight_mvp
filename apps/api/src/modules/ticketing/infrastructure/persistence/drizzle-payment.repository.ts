import { Inject, Injectable } from '@nestjs/common';
import { payment } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type { Payment } from '../../domain/entities/payment.entity';
import type { PaymentRepository } from '../../domain/ports/payment.repository';

@Injectable()
export class DrizzlePaymentRepository implements PaymentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(entity: Payment, tx?: unknown): Promise<Payment> {
    await this.exec(tx)
      .insert(payment)
      .values({
        id: entity.id,
        orderId: entity.orderId,
        gateway: entity.gateway,
        method: entity.method,
        gatewayReference: entity.gatewayReference,
        amount: entity.amount.toFixed(2),
        status: entity.status,
        failureReason: entity.failureReason,
        confirmedAt: entity.status === 'approved' ? new Date() : null,
      });
    return entity;
  }
}
