import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import {
  company,
  type DbClient,
  event,
  local,
  order,
  orderItem,
  ticket,
  ticketType,
  user,
} from '@urnight/db';
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

// E2E del BC Trust (reviews + reports) en UN archivo con BD privada propia,
// por lo que es seguro en paralelo con el resto de specs e2e (cada uno su base).
const DB = 'urnight_test_e2e_trust';

let app: INestApplication;
let client: DbClient;

beforeAll(async () => {
  await ensureNamedDbMigrated(DB);
  client = createNamedTestDb(DB);
  app = await createE2EApp(client);
}, 60000);

beforeEach(async () => {
  await truncateAll(client);
  await seedRoles(client);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

const http = () => request(app.getHttpServer());

/** RUC único de 11 dígitos (índice único `idx_company_ruc`) por inserción. */
function uniqueRuc(): string {
  return Math.floor(10_000_000_000 + Math.random() * 89_999_999_999).toString();
}

/** Siembra un usuario y devuelve su id (necesario por las FK de reviewer/reporter). */
async function seedUser(): Promise<string> {
  const userId = randomUUID();
  await client.db.insert(user).values({
    id: userId,
    fullName: 'Asistente',
    email: `user-${userId}@example.com`,
  });
  return userId;
}

interface SeedChain {
  userId: string;
  companyId: string;
  localId: string;
  eventId: string;
  ticketId: string;
}

/**
 * Siembra la cadena completa de asistencia user → company → local → event →
 * ticket_type → order → order_item → ticket. `ticketStatus` controla el filtro
 * de elegibilidad del adapter (`used` => reseña permitida). Si se pasa `userId`
 * se reutiliza ese usuario (p. ej. el reviewer autenticado).
 */
async function seedChain(
  opts: { userId?: string; ticketStatus?: string } = {},
): Promise<SeedChain> {
  const userId = opts.userId ?? (await seedUser());
  const companyId = randomUUID();
  const localId = randomUUID();
  const eventId = randomUUID();
  const ticketTypeId = randomUUID();
  const orderId = randomUUID();
  const orderItemId = randomUUID();
  const ticketId = randomUUID();

  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Empresa SAC',
    ruc: uniqueRuc(),
    commercialName: 'Empresa',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Centro',
    slug: `local-${localId}`,
  });
  await client.db.insert(event).values({
    id: eventId,
    localId,
    name: 'Fiesta',
    slug: `event-${eventId}`,
    startsAt: new Date(),
  });
  await client.db.insert(ticketType).values({
    id: ticketTypeId,
    eventId,
    name: 'General',
    price: '50.00',
    stock: 100,
  });
  await client.db.insert(order).values({
    id: orderId,
    orderCode: `ORD-${orderId}`.slice(0, 20),
    userId,
    eventId,
    subtotal: '50.00',
    total: '50.00',
  });
  await client.db.insert(orderItem).values({
    id: orderItemId,
    orderId,
    ticketTypeId,
    quantity: 1,
    unitPrice: '50.00',
    lineTotal: '50.00',
  });
  await client.db.insert(ticket).values({
    id: ticketId,
    orderItemId,
    eventId,
    ticketTypeId,
    qrCode: `QR-${ticketId}`.slice(0, 64),
    status: opts.ticketStatus ?? 'used',
  });

  return { userId, companyId, localId, eventId, ticketId };
}

/** Siembra solo un local (con su company) para reportes sin cadena de asistencia. */
async function seedLocal(): Promise<{ companyId: string; localId: string }> {
  const companyId = randomUUID();
  const localId = randomUUID();
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Empresa SAC',
    ruc: uniqueRuc(),
    commercialName: 'Empresa',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Reporte',
    slug: `local-${localId}`,
  });
  return { companyId, localId };
}

describe('Trust HTTP (e2e)', () => {
  describe('ReviewsController (/reviews)', () => {
    it('GET /reviews?localId= → 200 lista pública vacía sin token', async () => {
      const res = await http().get('/api/v1/reviews').query({ localId: randomUUID() });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('GET /reviews?localId= → 200 filtra por local (público)', async () => {
      const userId = await seedUser();
      const chain = await seedChain({ userId, ticketStatus: 'used' });
      const token = await signAccessToken(app, userId, ['user']);
      await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: chain.localId, ticketId: chain.ticketId, rating: 5 });

      const res = await http().get('/api/v1/reviews').query({ localId: chain.localId });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.localId).toBe(chain.localId);
      expect(res.body[0]?.isVerified).toBe(true);
    });

    it('GET /reviews?eventId= → 200 filtra por evento (público)', async () => {
      const userId = await seedUser();
      const chain = await seedChain({ userId, ticketStatus: 'used' });
      const token = await signAccessToken(app, userId, ['user']);
      await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'event', eventId: chain.eventId, ticketId: chain.ticketId, rating: 4 });

      const res = await http().get('/api/v1/reviews').query({ eventId: chain.eventId });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.eventId).toBe(chain.eventId);
    });

    it('POST /reviews → 401 sin token', async () => {
      const res = await http()
        .post('/api/v1/reviews')
        .send({ targetType: 'local', localId: randomUUID(), ticketId: randomUUID(), rating: 5 });
      expect(res.status).toBe(401);
    });

    it('POST /reviews → 422 Problem+JSON con body inválido', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /reviews → 422 con rating fuera de rango', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: randomUUID(), ticketId: randomUUID(), rating: 9 });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /reviews → 201 comprador verificado reseña su local (+shape)', async () => {
      const userId = await seedUser();
      const chain = await seedChain({ userId, ticketStatus: 'used' });
      const token = await signAccessToken(app, userId, ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetType: 'local',
          localId: chain.localId,
          ticketId: chain.ticketId,
          rating: 5,
          comment: 'Excelente local',
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.targetType).toBe('local');
      expect(res.body.localId).toBe(chain.localId);
      expect(res.body.rating).toBe(5);
      expect(res.body.comment).toBe('Excelente local');
      expect(res.body.isVerified).toBe(true);
      expect(res.body.status).toBe('published');
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('POST /reviews → 403 Problem+JSON sin entrada usada (no elegible)', async () => {
      const userId = await seedUser();
      // Ticket en estado `valid` (no `used`) → el adapter no devuelve contexto.
      const chain = await seedChain({ userId, ticketStatus: 'valid' });
      const token = await signAccessToken(app, userId, ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: chain.localId, ticketId: chain.ticketId, rating: 5 });
      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('trust/review-not-eligible');
    });

    it('POST /reviews → 403 si el ticket pertenece a otro usuario', async () => {
      const ownerId = await seedUser();
      const chain = await seedChain({ userId: ownerId, ticketStatus: 'used' });
      const intruderId = await seedUser();
      const token = await signAccessToken(app, intruderId, ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: chain.localId, ticketId: chain.ticketId, rating: 5 });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('trust/review-not-eligible');
    });

    it('POST /reviews → 403 si el local no coincide con el del ticket', async () => {
      const userId = await seedUser();
      const chain = await seedChain({ userId, ticketStatus: 'used' });
      const { localId: otherLocalId } = await seedLocal();
      const token = await signAccessToken(app, userId, ['user']);
      const res = await http()
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: otherLocalId, ticketId: chain.ticketId, rating: 5 });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('trust/review-not-eligible');
    });
  });

  describe('ReportsController (/reports)', () => {
    const REPORT = (localId: string) => ({
      targetType: 'local' as const,
      localId,
      reason: 'unsafe' as const,
      comment: 'Situación insegura',
      severity: 'high' as const,
    });

    it('POST /reports → 401 sin token', async () => {
      const res = await http()
        .post('/api/v1/reports')
        .send({ targetType: 'local', localId: randomUUID(), reason: 'other' });
      expect(res.status).toBe(401);
    });

    it('POST /reports → 422 Problem+JSON con body inválido', async () => {
      const reporterId = await seedUser();
      const token = await signAccessToken(app, reporterId, ['user']);
      const res = await http()
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local' }); // falta reason (localId)
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /reports → 422 con reason inválido', async () => {
      const reporterId = await seedUser();
      const token = await signAccessToken(app, reporterId, ['user']);
      const res = await http()
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetType: 'local', localId: randomUUID(), reason: 'inventado' });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /reports → 201 usuario autenticado reporta un local (+shape)', async () => {
      const reporterId = await seedUser();
      const { localId } = await seedLocal();
      const token = await signAccessToken(app, reporterId, ['user']);
      const res = await http()
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token}`)
        .send(REPORT(localId));
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.targetType).toBe('local');
      expect(res.body.localId).toBe(localId);
      expect(res.body.reason).toBe('unsafe');
      expect(res.body.severity).toBe('high');
      expect(res.body.status).toBe('open');
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('POST /reports/:id/resolve → 401 sin token', async () => {
      const res = await http()
        .post(`/api/v1/reports/${randomUUID()}/resolve`)
        .send({ resolutionNote: 'Revisado y cerrado' });
      expect(res.status).toBe(401);
    });

    it('POST /reports/:id/resolve → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/reports/${randomUUID()}/resolve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolutionNote: 'Revisado y cerrado' });
      expect(res.status).toBe(403);
    });

    it('POST /reports/:id/resolve → 422 con nota inválida', async () => {
      const adminId = await seedUser();
      const token = await signAccessToken(app, adminId, ['admin_local']);
      const res = await http()
        .post(`/api/v1/reports/${randomUUID()}/resolve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolutionNote: 'no' }); // min(3)
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /reports/:id/resolve → 404 Problem+JSON si el reporte no existe', async () => {
      const adminId = await seedUser();
      const token = await signAccessToken(app, adminId, ['admin_local']);
      const res = await http()
        .post(`/api/v1/reports/${randomUUID()}/resolve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolutionNote: 'No encontrado' });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('trust/report-not-found');
    });

    it('POST /reports/:id/resolve → 200 admin_local resuelve el reporte (+shape)', async () => {
      const reporterId = await seedUser();
      const { companyId, localId } = await seedLocal();
      const reporterToken = await signAccessToken(app, reporterId, ['user']);
      const created = await http()
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send(REPORT(localId));

      const adminId = await seedUser();
      const adminToken = await signAccessToken(app, adminId, ['admin_local'], {
        companyId,
      });
      const res = await http()
        .post(`/api/v1/reports/${created.body.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolutionNote: 'Atendido por el equipo' });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.status).toBe('resolved');
    });

    it('POST /reports/:id/resolve → 200 super_admin también puede resolver', async () => {
      const reporterId = await seedUser();
      const { localId } = await seedLocal();
      const reporterToken = await signAccessToken(app, reporterId, ['user']);
      const created = await http()
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .send(REPORT(localId));

      const adminId = await seedUser();
      const adminToken = await signAccessToken(app, adminId, ['super_admin']);
      const res = await http()
        .post(`/api/v1/reports/${created.body.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolutionNote: 'Resuelto por super admin' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
    });
  });
});
