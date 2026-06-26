import { Injectable, type OnModuleInit } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { AttributeSaleUseCase } from '../use-cases/attribute-sale.use-case';

interface OrderPaidShape {
  orderId: string;
  total: number;
  referralCode: string | null;
}

/**
 * Suscriptor de OrderPaid (§3.2). Desacoplado de Checkout: reacciona al evento
 * por nombre y atribuye la venta al promotor del referral code (best-effort).
 */
@Injectable()
export class OrderPaidSubscriber implements OnModuleInit {
  private readonly log = createLogger(OrderPaidSubscriber.name);

  constructor(
    private readonly bus: EventBus,
    private readonly attribute: AttributeSaleUseCase,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe('checkout.order_paid', async (event) => {
      const p = event.payload as OrderPaidShape;
      if (!p.referralCode) return;
      try {
        await this.attribute.execute({
          orderId: p.orderId,
          referralCode: p.referralCode,
          amount: p.total,
        });
        this.log.info({ orderId: p.orderId, referralCode: p.referralCode }, 'promoters.sale.attributed');
      } catch (err) {
        this.log.warn({ orderId: p.orderId, err: (err as Error).message }, 'promoters.sale.attribution_failed');
      }
    });
  }
}
