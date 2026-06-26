import type { Payment } from '../entities/payment.entity';

export interface PaymentRepository {
  create(payment: Payment, tx?: unknown): Promise<Payment>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
