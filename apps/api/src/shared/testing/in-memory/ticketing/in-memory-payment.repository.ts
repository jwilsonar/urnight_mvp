import type { Payment } from '../../../../modules/ticketing/domain/entities/payment.entity';
import type { PaymentRepository } from '../../../../modules/ticketing/domain/ports/payment.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** PaymentRepository en memoria. Replica el insert del adapter Drizzle. */
export class InMemoryPaymentRepository
  extends InMemoryRepository<Payment>
  implements PaymentRepository
{
  async create(payment: Payment, _tx?: unknown): Promise<Payment> {
    this.put(payment);
    return payment;
  }
}
