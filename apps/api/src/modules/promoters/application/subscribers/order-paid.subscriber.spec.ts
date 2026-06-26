import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '../../../../shared/event-bus/domain-event';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryPromoterRepository,
  InMemoryReferralLinkRepository,
  InMemorySaleAttributionRepository,
} from '../../../../shared/testing/in-memory/promoters';
import {
  PromoterBuilder,
  ReferralLinkBuilder,
} from '../../../../shared/testing/builders/promoters';
import { AttributeSaleUseCase } from '../use-cases/attribute-sale.use-case';
import { OrderPaidSubscriber } from './order-paid.subscriber';

function build() {
  const links = new InMemoryReferralLinkRepository();
  const promoters = new InMemoryPromoterRepository(links);
  const attributions = new InMemorySaleAttributionRepository();
  const attribute = new AttributeSaleUseCase(links, promoters, attributions);
  const bus = new EventBus();
  const subscriber = new OrderPaidSubscriber(bus, attribute);
  subscriber.onModuleInit();
  return { bus, links, promoters, attributions };
}

/** Construye un evento checkout.order_paid con el payload mínimo que lee el suscriptor. */
function orderPaid(payload: {
  orderId: string;
  total: number;
  referralCode: string | null;
}): DomainEvent {
  return { name: 'checkout.order_paid', occurredAt: new Date(), payload };
}

describe('OrderPaidSubscriber', () => {
  it('reacciona a checkout.order_paid y atribuye la venta al promotor del referral', async () => {
    const { bus, links, promoters, attributions } = build();
    promoters.seed(new PromoterBuilder().withId('p1').build());
    links.seed(new ReferralLinkBuilder().withPromoterId('p1').withCode('REF1').build());

    await bus.publish(orderPaid({ orderId: 'o1', total: 200, referralCode: 'REF1' }));

    expect(attributions.size).toBe(1);
    expect(attributions.all[0]?.orderId).toBe('o1');
    expect(attributions.all[0]?.commissionAmount).toBe(10); // 200 * 0.05
  });

  it('sin referralCode → no intenta atribuir (no-op)', async () => {
    const { bus, attributions } = build();

    await bus.publish(orderPaid({ orderId: 'o1', total: 200, referralCode: null }));

    expect(attributions.size).toBe(0);
  });

  it('best-effort: si la atribución falla, no propaga el error (no rompe el pago)', async () => {
    const { bus, attributions } = build();
    // referralCode desconocido → AttributeSaleUseCase no encuentra link y no atribuye.
    await expect(
      bus.publish(orderPaid({ orderId: 'o1', total: 200, referralCode: 'GHOST' })),
    ).resolves.toBeUndefined();
    expect(attributions.size).toBe(0);
  });
});
