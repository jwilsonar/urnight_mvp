import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  company,
  local,
  localOrder,
  localOrderSplit,
  localOrderSplitPayment,
  type DbClient,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle.service';
import {
  createTestDb,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import { DrizzleUnitOfWork } from '../../../../shared/unit-of-work/drizzle-unit-of-work';
import type { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { RegisterLocalOrderSplitPaymentUseCase } from '../../application/use-cases/register-local-order-split-payment.use-case';
import type { LocalOrder } from '../../domain/entities/local-order.entity';
import { DrizzleLocalOrderRepository } from './drizzle-local-order.repository';
import { DrizzleLocalOrderSplitRepository } from './drizzle-local-order-split.repository';

let client: DbClient;
let orders: DrizzleLocalOrderRepository;
let splits: DrizzleLocalOrderSplitRepository;
let uow: UnitOfWork;

beforeAll(() => {
  client = createTestDb();
  orders = new DrizzleLocalOrderRepository(client.db);
  splits = new DrizzleLocalOrderSplitRepository(client.db);
  uow = new DrizzleUnitOfWork({ db: client.db } as DrizzleService);
});

afterEach(async () => {
  await truncateAll(client);
});

afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

async function seedSplit(): Promise<{ orderId: string; shareToken: string }> {
  const companyId = randomUUID();
  const localId = randomUUID();
  const orderId = randomUUID();
  const shareToken = `split-${randomUUID()}`;
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Pedidos Integration S.A.C.',
    ruc: '20999999992',
    commercialName: 'Pedidos Integration',
    status: 'active',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Pedidos Integration',
    slug: `pedidos-${localId}`,
    status: 'active',
  });
  await client.db.insert(localOrder).values({
    id: orderId,
    localId,
    attendeeName: 'Andrea',
    pickupCode: 'ABC234',
    pickupZone: 'Barra norte',
    status: 'received',
    paymentMethod: 'card',
    paymentStatus: 'pending',
    totalAmount: '70.00',
    currency: 'PEN',
  });
  await client.db.insert(localOrderSplit).values({
    id: randomUUID(),
    orderId,
    shareToken,
    expectedTotal: '70.00',
  });
  return { orderId, shareToken };
}

describe('cierre transaccional del split (integration)', () => {
  it('registra el último pago y marca el pedido pagado en la misma transacción', async () => {
    const { orderId, shareToken } = await seedSplit();
    const useCase = new RegisterLocalOrderSplitPaymentUseCase(orders, splits, uow);

    await useCase.execute({
      shareToken,
      dto: { payerName: 'Andrea', amount: 30 },
    });
    const completed = await useCase.execute({
      shareToken,
      dto: { payerName: 'Luis', amount: 40 },
    });

    const [storedOrder] = await client.db
      .select()
      .from(localOrder)
      .where(eq(localOrder.id, orderId));
    const storedPayments = await client.db.select().from(localOrderSplitPayment);
    expect(completed.isPaid).toBe(true);
    expect(storedPayments).toHaveLength(2);
    expect(storedOrder?.paymentStatus).toBe('paid');
    expect(storedOrder?.paidAt).toBeInstanceOf(Date);
  });

  it('revierte pago parcial y cierre si falla la actualización final del pedido', async () => {
    const { orderId, shareToken } = await seedSplit();
    class FailingOrderRepository extends DrizzleLocalOrderRepository {
      override async save(order: LocalOrder, tx?: unknown): Promise<LocalOrder> {
        await super.save(order, tx);
        throw new Error('fallo final simulado');
      }
    }
    const failingOrders = new FailingOrderRepository(client.db);
    const useCase = new RegisterLocalOrderSplitPaymentUseCase(
      failingOrders,
      splits,
      uow,
    );

    await expect(
      useCase.execute({
        shareToken,
        dto: { payerName: 'Andrea', amount: 70 },
      }),
    ).rejects.toThrow('fallo final simulado');

    const [storedOrder] = await client.db
      .select()
      .from(localOrder)
      .where(eq(localOrder.id, orderId));
    const storedPayments = await client.db.select().from(localOrderSplitPayment);
    expect(storedOrder?.paymentStatus).toBe('pending');
    expect(storedPayments).toHaveLength(0);
  });
});
