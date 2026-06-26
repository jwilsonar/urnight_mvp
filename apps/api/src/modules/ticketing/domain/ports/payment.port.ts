import type { PaymentMethod } from '../entities/payment.entity';

export interface ChargeInput {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

export interface ChargeResult {
  approved: boolean;
  reference?: string;
  failureReason?: string;
}

/**
 * Puerto de pagos (Anti-Corruption Layer §3.2). MVP: MockPaymentAdapter.
 * Culqi/Izipay quedan fuera del MVP.
 */
export abstract class PaymentPort {
  abstract charge(input: ChargeInput): Promise<ChargeResult>;
}
