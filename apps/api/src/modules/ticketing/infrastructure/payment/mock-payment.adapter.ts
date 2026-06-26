import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import { PaymentPort, type ChargeInput, type ChargeResult } from '../../domain/ports/payment.port';

/**
 * Adapter de pago MOCK (ACL §). Único del MVP: aprueba siempre y devuelve una
 * referencia simulada. Culqi/Izipay fuera del MVP. Reemplazable sin tocar el dominio.
 */
@Injectable()
export class MockPaymentAdapter extends PaymentPort {
  private readonly log = createLogger(MockPaymentAdapter.name);

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const reference = `mock_${randomUUID()}`;
    this.log.info(
      { orderId: input.orderId, amount: input.amount, currency: input.currency, method: input.method, reference },
      'payment.charge.approved',
    );
    return { approved: true, reference };
  }
}
