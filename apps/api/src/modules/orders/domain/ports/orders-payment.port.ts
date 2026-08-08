import type { LocalOrderPaymentMethod } from '@urnight/contracts';

export interface OrdersChargeInput {
  orderId: string;
  amount: number;
  currency: string;
  method: LocalOrderPaymentMethod;
}

export interface OrdersChargeResult {
  approved: boolean;
  reference?: string;
  failureReason?: string;
}

export interface OrdersPaymentPort {
  charge(input: OrdersChargeInput): Promise<OrdersChargeResult>;
}

export const ORDERS_PAYMENT_PORT = Symbol('ORDERS_PAYMENT_PORT');
