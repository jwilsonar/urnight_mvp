import { randomUUID } from 'node:crypto';
import {
  Payment,
  type PaymentGateway,
  type PaymentMethod,
} from '../../../../modules/ticketing/domain/entities/payment.entity';

/** Builder fluido para el aggregate Payment (estado inicial: pending). */
export class PaymentBuilder {
  private id: string = randomUUID();
  private orderId = 'order-1';
  private method: PaymentMethod = 'card';
  private amount = 100;
  private gateway: PaymentGateway | undefined = undefined;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withOrder(orderId: string): this {
    this.orderId = orderId;
    return this;
  }

  withMethod(method: PaymentMethod): this {
    this.method = method;
    return this;
  }

  withAmount(amount: number): this {
    this.amount = amount;
    return this;
  }

  withGateway(gateway: PaymentGateway): this {
    this.gateway = gateway;
    return this;
  }

  build(): Payment {
    return Payment.initiate({
      id: this.id,
      orderId: this.orderId,
      method: this.method,
      amount: this.amount,
      gateway: this.gateway,
    });
  }
}
