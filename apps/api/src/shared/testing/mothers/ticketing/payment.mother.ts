import type { Payment } from '../../../../modules/ticketing/domain/entities/payment.entity';
import { PaymentBuilder } from '../../builders/ticketing/payment.builder';

/** Casos predefinidos de Payment. */
export const PaymentMother = {
  /** Pago iniciado (pending). */
  pending: (): Payment => new PaymentBuilder().build(),
  /** Pago aprobado con referencia. */
  approved: (): Payment => {
    const payment = new PaymentBuilder().build();
    payment.approve('ref-123');
    return payment;
  },
  /** Pago rechazado con razón. */
  rejected: (): Payment => {
    const payment = new PaymentBuilder().build();
    payment.reject('Fondos insuficientes');
    return payment;
  },
};
