import type {
  OrdersChargeInput,
  OrdersChargeResult,
  OrdersPaymentPort,
} from '../../../modules/orders/domain/ports/orders-payment.port';

export class FakeOrdersPaymentPort implements OrdersPaymentPort {
  readonly charges: OrdersChargeInput[] = [];
  private approved = true;
  private failureReason: string | undefined;

  rejecting(reason = 'Pago rechazado'): this {
    this.approved = false;
    this.failureReason = reason;
    return this;
  }

  async charge(input: OrdersChargeInput): Promise<OrdersChargeResult> {
    this.charges.push({ ...input });
    return this.approved
      ? { approved: true, reference: 'mock-order-payment' }
      : { approved: false, failureReason: this.failureReason };
  }
}
