import {
  PaymentPort,
  type ChargeInput,
  type ChargeResult,
} from '../../../../../modules/ticketing/domain/ports/payment.port';

/**
 * PaymentPort de prueba (ACL §3.2). Configurable: por defecto aprueba (como el
 * MockPaymentAdapter del MVP). `rejecting()` fuerza el rechazo del cobro y
 * `approving()` lo vuelve a aprobar. Registra el último input para aserciones.
 */
export class FakePaymentPort extends PaymentPort {
  private approved = true;
  private reference = 'fake_ref';
  private failureReason = 'Pago rechazado';

  /** Inputs recibidos por `charge`, en orden. */
  readonly charges: ChargeInput[] = [];

  /** Configura el puerto para aprobar el cobro (estado por defecto). */
  approving(reference = 'fake_ref'): this {
    this.approved = true;
    this.reference = reference;
    return this;
  }

  /** Configura el puerto para rechazar el cobro con una razón dada. */
  rejecting(failureReason = 'Pago rechazado'): this {
    this.approved = false;
    this.failureReason = failureReason;
    return this;
  }

  /** Último input recibido por `charge` (o undefined). */
  lastCharge(): ChargeInput | undefined {
    return this.charges[this.charges.length - 1];
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    this.charges.push(input);
    return this.approved
      ? { approved: true, reference: this.reference }
      : { approved: false, failureReason: this.failureReason };
  }
}
