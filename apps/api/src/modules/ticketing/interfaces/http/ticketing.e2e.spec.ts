import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import {
  type DbClient,
  attendee as attendeeTable,
  company as companyTable,
  event as eventTable,
  local as localTable,
  order as orderTable,
  orderItem as orderItemTable,
  ticket as ticketTable,
  ticketHold as ticketHoldTable,
  ticketType as ticketTypeTable,
  user as userTable,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  createE2EApp,
  seedRoles,
  signAccessToken,
} from '../../../../shared/testing/integration/e2e-app';
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import { REDIS } from '../../../../shared/redis/redis.module';

// E2E del BC Ticketing en UN archivo, con BD privada propia para correr en
// paralelo de forma segura (cada spec tiene su base aislada en la instancia 5433).
const DB = 'urnight_test_e2e_ticketing';

let app: INestApplication;
let client: DbClient;

beforeAll(async () => {
  await ensureNamedDbMigrated(DB);
  client = createNamedTestDb(DB);
  app = await createE2EApp(client);
  // El harness inyecta un Redis falso mínimo (solo incr/expire). El checkout usa
  // un lock distribuido (SET NX PX + release vía EVAL); le añadimos una
  // implementación en memoria para que `withLock` funcione en e2e sin Redis real.
  augmentRedisLock(app.get(REDIS) as Record<string, unknown>);
}, 60000);

/** Añade SET NX / EVAL / DEL al cliente Redis falso del harness (lock en memoria). */
function augmentRedisLock(redis: Record<string, unknown>): void {
  const store = new Map<string, string>();
  redis.set = async (key: string, value: string, ..._args: unknown[]): Promise<string | null> => {
    // Simula SET ... NX: solo escribe si la clave no existe.
    if (store.has(key)) return null;
    store.set(key, value);
    return 'OK';
  };
  redis.eval = async (_script: string, _numKeys: number, key: string): Promise<number> => {
    // Simula el release del lock (DEL si el token coincide); basta con borrar.
    store.delete(key);
    return 1;
  };
}

beforeEach(async () => {
  await truncateAll(client);
  await seedRoles(client);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

const http = () => request(app.getHttpServer());

interface SeededInventory {
  userId: string;
  eventId: string;
  ticketTypeId: string;
  localId: string;
  companyId: string;
}

/**
 * Siembra la cadena de FK: user → company → local → event → ticket_type.
 * Devuelve ids. El usuario es el comprador autenticado (order.user_id FK).
 */
async function seedInventory(
  opts: { stock?: number; sold?: number; eventStatus?: string; ticketTypeStatus?: string } = {},
): Promise<SeededInventory> {
  const userId = randomUUID();
  await client.db.insert(userTable).values({
    id: userId,
    fullName: 'Ada Lovelace',
    email: `buyer-${userId}@example.com`,
    documentType: 'dni',
    documentNumber: randomUUID().replace(/\D/g, '').slice(0, 8).padEnd(8, '0'),
  });

  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'Empresa Test',
    ruc: randomUUID().replace(/\D/g, '').slice(0, 11).padEnd(11, '0'),
    commercialName: 'Comercial Test',
    status: 'active',
  });

  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: 'Local Centro',
    slug: `local-${localId}`,
    status: 'active',
  });

  const eventId = randomUUID();
  await client.db.insert(eventTable).values({
    id: eventId,
    localId,
    name: 'Fiesta Test',
    slug: `evento-${eventId}`,
    startsAt: new Date(),
    status: opts.eventStatus ?? 'published',
  });

  const ticketTypeId = randomUUID();
  await client.db.insert(ticketTypeTable).values({
    id: ticketTypeId,
    eventId,
    name: 'General',
    price: '50.00',
    stock: opts.stock ?? 100,
    sold: opts.sold ?? 0,
    status: opts.ticketTypeStatus ?? 'active',
  });

  return { userId, eventId, ticketTypeId, localId, companyId };
}

/** Asistente válido (18+) para el body del checkout. */
function buildAttendee(fullName = 'Grace Hopper'): Record<string, unknown> {
  return {
    fullName,
    documentType: 'dni',
    documentNumber: randomUUID().replace(/\D/g, '').slice(0, 8).padEnd(8, '0'),
    birthDate: '1990-01-01',
    isBuyer: true,
  };
}

/** Body de checkout para un evento + tipo de entrada, con N asistentes. */
function checkoutBody(
  seed: SeededInventory,
  attendees: Record<string, unknown>[] = [buildAttendee()],
): Record<string, unknown> {
  return {
    eventId: seed.eventId,
    method: 'card',
    items: [{ ticketTypeId: seed.ticketTypeId, attendees }],
  };
}

/**
 * Inserta directamente una entrada emitida (order → order_item → ticket → attendee)
 * para los tests de billetera y validación de QR (sin pasar por el checkout).
 */
async function seedIssuedTicket(
  seed: SeededInventory,
  qrCode: string,
  status: 'valid' | 'used' | 'cancelled' = 'valid',
): Promise<{ ticketId: string }> {
  const orderId = randomUUID();
  await client.db.insert(orderTable).values({
    id: orderId,
    orderCode: `ORD-${qrCode.slice(0, 8)}`,
    userId: seed.userId,
    eventId: seed.eventId,
    subtotal: '50.00',
    total: '55.00',
    currency: 'PEN',
    status: 'paid',
    paidAt: new Date(),
  });

  const orderItemId = randomUUID();
  await client.db.insert(orderItemTable).values({
    id: orderItemId,
    orderId,
    ticketTypeId: seed.ticketTypeId,
    quantity: 1,
    unitPrice: '50.00',
    lineTotal: '50.00',
  });

  const ticketId = randomUUID();
  await client.db.insert(ticketTable).values({
    id: ticketId,
    orderItemId,
    eventId: seed.eventId,
    ticketTypeId: seed.ticketTypeId,
    qrCode,
    status,
  });

  await client.db.insert(attendeeTable).values({
    id: randomUUID(),
    ticketId,
    fullName: 'Grace Hopper',
    documentType: 'dni',
    documentNumber: randomUUID().replace(/\D/g, '').slice(0, 8).padEnd(8, '0'),
    birthDate: '1990-01-01',
    isBuyer: true,
  });

  return { ticketId };
}

/**
 * Siembra un usuario validador real y devuelve su token. El id debe existir en
 * `user` porque qr_validation.validated_by tiene FK → user.id. C1: el token lleva
 * el scope multi-tenant (local/empresa) que el use-case exige para validar.
 */
async function seedValidatorToken(
  scope: { companyId?: string | null; localId?: string | null } = {},
): Promise<string> {
  const validatorId = randomUUID();
  await client.db.insert(userTable).values({
    id: validatorId,
    fullName: 'Validador Puerta',
    email: `validator-${validatorId}@example.com`,
    documentType: 'dni',
    documentNumber: randomUUID().replace(/\D/g, '').slice(0, 8).padEnd(8, '0'),
  });
  return signAccessToken(app, validatorId, ['validator'], scope);
}

describe('Ticketing HTTP (e2e)', () => {
  describe('TicketHoldsController', () => {
    it('POST crea el hold y DELETE lo libera explícitamente', async () => {
      const seed = await seedInventory({ stock: 1 });
      const token = await signAccessToken(app, seed.userId, ['user']);

      const created = await http()
        .post('/api/v1/ticket-holds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventId: seed.eventId,
          ticketTypeId: seed.ticketTypeId,
          quantity: 1,
        });

      expect(created.status).toBe(201);
      expect(created.body.status).toBe('active');
      expect(created.body.ticketTypeId).toBe(seed.ticketTypeId);

      const released = await http()
        .delete(`/api/v1/ticket-holds/${created.body.id as string}`)
        .set('Authorization', `Bearer ${token}`);
      expect(released.status).toBe(204);

      const [row] = await client.db
        .select({ status: ticketHoldTable.status })
        .from(ticketHoldTable)
        .where(eq(ticketHoldTable.id, created.body.id as string))
        .limit(1);
      expect(row?.status).toBe('released');
    });
  });

  describe('OrdersController — POST /orders/checkout', () => {
    it('→ 401 sin token', async () => {
      const seed = await seedInventory();
      const res = await http().post('/api/v1/orders/checkout').send(checkoutBody(seed));
      expect(res.status).toBe(401);
    });

    it('→ 422 Problem+JSON con body inválido', async () => {
      const seed = await seedInventory();
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ eventId: 'no-es-uuid', items: [], method: 'efectivo' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('→ 201 compra feliz: devuelve la orden y las entradas emitidas', async () => {
      const seed = await seedInventory({ stock: 10 });
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutBody(seed, [buildAttendee('Ada'), buildAttendee('Grace')]));

      expect(res.status).toBe(201);
      expect(res.body.order.eventId).toBe(seed.eventId);
      expect(res.body.order.status).toBe('paid');
      expect(typeof res.body.order.orderCode).toBe('string');
      expect(res.body.order.total).toBeGreaterThan(0);
      expect(res.body.order.items).toHaveLength(1);
      expect(res.body.order.items[0]?.quantity).toBe(2);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.tickets).toHaveLength(2);
      expect(res.body.tickets[0]?.status).toBe('valid');
      expect(typeof res.body.tickets[0]?.qrCode).toBe('string');
      expect(res.body.tickets[0]?.eventId).toBe(seed.eventId);
    });

    it('convierte el hold al confirmar el pago', async () => {
      const seed = await seedInventory({ stock: 1 });
      const token = await signAccessToken(app, seed.userId, ['user']);
      const held = await http()
        .post('/api/v1/ticket-holds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventId: seed.eventId,
          ticketTypeId: seed.ticketTypeId,
          quantity: 1,
        });
      const body = checkoutBody(seed) as {
        eventId: string;
        method: string;
        items: Array<{
          ticketTypeId: string;
          holdId?: string;
          attendees: Record<string, unknown>[];
        }>;
      };
      body.items[0]!.holdId = held.body.id as string;

      const paid = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(paid.status).toBe(201);

      const [hold] = await client.db
        .select({
          status: ticketHoldTable.status,
          orderId: ticketHoldTable.orderId,
        })
        .from(ticketHoldTable)
        .where(eq(ticketHoldTable.id, held.body.id as string))
        .limit(1);
      expect(hold?.status).toBe('converted');
      expect(hold?.orderId).toBe(paid.body.order.id);
    });

    it('→ 409 Problem+JSON si no hay stock suficiente', async () => {
      const seed = await seedInventory({ stock: 1, sold: 1 });
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutBody(seed));

      expect(res.status).toBe(409);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('checkout/insufficient-stock');
    });

    it('→ 409 Problem+JSON si el evento no está a la venta', async () => {
      const seed = await seedInventory({ eventStatus: 'draft' });
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutBody(seed));

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('checkout/event-not-on-sale');
    });

    it('→ 404 Problem+JSON si el tipo de entrada no existe', async () => {
      const seed = await seedInventory();
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventId: seed.eventId,
          method: 'card',
          items: [{ ticketTypeId: randomUUID(), attendees: [buildAttendee()] }],
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('checkout/ticket-type-not-found');
    });
  });

  describe('OrdersController — GET /orders/:id', () => {
    it('→ 401 sin token', async () => {
      const res = await http().get(`/api/v1/orders/${randomUUID()}`);
      expect(res.status).toBe(401);
    });

    it('→ 200 devuelve el detalle de la orden propia', async () => {
      const seed = await seedInventory({ stock: 5 });
      const token = await signAccessToken(app, seed.userId, ['user']);
      const created = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutBody(seed));
      const orderId = created.body.order.id as string;

      const res = await http()
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body.eventId).toBe(seed.eventId);
      expect(res.body.status).toBe('paid');
    });

    it('→ 404 Problem+JSON si la orden no existe', async () => {
      const seed = await seedInventory();
      const token = await signAccessToken(app, seed.userId, ['user']);
      const res = await http()
        .get(`/api/v1/orders/${randomUUID()}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('checkout/order-not-found');
    });

    it('→ 404 si la orden es de otro usuario (aislamiento)', async () => {
      const seed = await seedInventory({ stock: 5 });
      const ownerToken = await signAccessToken(app, seed.userId, ['user']);
      const created = await http()
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(checkoutBody(seed));
      const orderId = created.body.order.id as string;

      const intruderToken = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${intruderToken}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('checkout/order-not-found');
    });
  });

  describe('TicketsController — GET /tickets/me', () => {
    it('→ 401 sin token', async () => {
      const res = await http().get('/api/v1/tickets/me');
      expect(res.status).toBe(401);
    });

    it('→ 200 devuelve la billetera del usuario (sus entradas)', async () => {
      const seed = await seedInventory();
      await seedIssuedTicket(seed, 'QR-WALLET-1');
      const token = await signAccessToken(app, seed.userId, ['user']);

      const res = await http().get('/api/v1/tickets/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.qrCode).toBe('QR-WALLET-1');
      expect(res.body[0]?.status).toBe('valid');
      expect(res.body[0]?.attendeeName).toBe('Grace Hopper');
      expect(res.body[0]?.eventId).toBe(seed.eventId);
    });

    it('→ 200 lista vacía si el usuario no tiene entradas', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http().get('/api/v1/tickets/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('ValidationController — POST /validations/scan', () => {
    it('→ 401 sin token', async () => {
      const res = await http().post('/api/v1/validations/scan').send({ qrCode: 'QR-NOAUTH-1' });
      expect(res.status).toBe(401);
    });

    it('→ 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/validations/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({ qrCode: 'QR-FORBIDDEN-1' });
      expect(res.status).toBe(403);
    });

    it('→ 422 Problem+JSON con body inválido (qrCode demasiado corto)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['validator']);
      const res = await http()
        .post('/api/v1/validations/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({ qrCode: 'x' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
    });

    it('→ 200 result=valid con QR de una entrada emitida', async () => {
      const seed = await seedInventory();
      const { ticketId } = await seedIssuedTicket(seed, 'QR-VALID-001');
      const validatorToken = await seedValidatorToken({ localId: seed.localId });

      const res = await http()
        .post('/api/v1/validations/scan')
        .set('Authorization', `Bearer ${validatorToken}`)
        .send({ qrCode: 'QR-VALID-001' });
      expect(res.status).toBe(200);
      expect(res.body.result).toBe('valid');
      expect(res.body.ticketId).toBe(ticketId);
      expect(typeof res.body.message).toBe('string');
    });

    it('→ 200 result=already_used si la entrada ya fue usada', async () => {
      const seed = await seedInventory();
      await seedIssuedTicket(seed, 'QR-USED-001', 'used');
      const validatorToken = await seedValidatorToken({ localId: seed.localId });

      const res = await http()
        .post('/api/v1/validations/scan')
        .set('Authorization', `Bearer ${validatorToken}`)
        .send({ qrCode: 'QR-USED-001' });
      expect(res.status).toBe(200);
      expect(res.body.result).toBe('already_used');
    });

    it('→ 200 result=invalid si el QR no corresponde a ninguna entrada', async () => {
      const validatorToken = await seedValidatorToken();
      const res = await http()
        .post('/api/v1/validations/scan')
        .set('Authorization', `Bearer ${validatorToken}`)
        .send({ qrCode: 'QR-INEXISTENTE-XYZ' });
      expect(res.status).toBe(200);
      expect(res.body.result).toBe('invalid');
      expect(res.body.ticketId).toBeNull();
    });
  });
});
