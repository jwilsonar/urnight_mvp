import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { type DbClient, company, local, user } from '@urnight/db';
import type { Redis } from 'ioredis';
import request from 'supertest';
import { createE2EApp, seedRoles, signAccessToken } from '../../../../shared/testing/integration/e2e-app';
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import { REDIS } from '../../../../shared/redis/redis.module';

// E2E del HTTP del BC Events en UN archivo. Base privada por archivo para
// poder correr en paralelo con el resto de specs e2e sin carreras.
const DB = 'urnight_test_e2e_events';

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
  // El rate-limit (APP_GUARD por IP en Redis) acumula entre tests; lo reseteamos
  // para que el alto volumen de requests de este spec no dispare 429 espurios.
  const redis = app.get<Redis>(REDIS);
  const keys = await redis.keys('ratelimit:*');
  if (keys.length > 0) await redis.del(...keys);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

const http = () => request(app.getHttpServer());

/** Siembra company + local (FK event.local_id → local.id). Devuelve el localId. */
async function seedLocal(): Promise<string> {
  const companyId = randomUUID();
  const localId = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  await client.db.insert(company).values({
    id: companyId,
    legalName: `Disco SAC ${suffix}`,
    ruc: String(Date.now()).slice(-11).padStart(11, '0'),
    commercialName: `Disco ${suffix}`,
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: `Local ${suffix}`,
    slug: `local-${suffix}`,
  });
  return localId;
}

/** Registra un usuario real (FK event.created_by → user.id) y devuelve su id. */
async function seedUser(): Promise<string> {
  const id = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  await client.db.insert(user).values({
    id,
    fullName: `Admin ${suffix}`,
    email: `admin-${suffix}@example.com`,
  });
  return id;
}

/** Mint de un token admin_local con un usuario real como sub y, si aplica, scope de local. */
async function adminToken(localId?: string): Promise<{ token: string; userId: string }> {
  const userId = await seedUser();
  const token = await signAccessToken(app, userId, ['admin_local'], localId ? { localId } : {});
  return { token, userId };
}

function buildEventDto(localId: string, slug = `fiesta-${randomUUID().slice(0, 8)}`) {
  return {
    localId,
    name: 'Noche Techno',
    slug,
    description: 'Una fiesta techno',
    startsAt: '2026-07-01T22:00:00.000Z',
    totalCapacity: 500,
    minAgeNote: '+18',
    dressCode: 'Casual',
  };
}

/** Crea un evento vía HTTP (admin_local) y devuelve el cuerpo de respuesta. */
async function createEvent(
  token: string,
  localId: string,
  slug?: string,
): Promise<Record<string, unknown>> {
  const res = await http()
    .post('/api/v1/events')
    .set('Authorization', `Bearer ${token}`)
    .send(buildEventDto(localId, slug));
  return res.body as Record<string, unknown>;
}

describe('Events HTTP (e2e)', () => {
  describe('EventsController — lectura pública', () => {
    it('GET /events → 200 lista vacía sin token (público)', async () => {
      const res = await http().get('/api/v1/events');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('GET /events → 200 solo muestra eventos publicados', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      const created = await createEvent(token, localId, 'evento-publicado');
      // Borrador no publicado: no debe aparecer.
      await createEvent(token, localId, 'evento-borrador');
      await http()
        .post(`/api/v1/events/${created.id as string}/publish`)
        .set('Authorization', `Bearer ${token}`);

      const res = await http().get('/api/v1/events');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.slug).toBe('evento-publicado');
      expect(res.body[0]?.status).toBe('published');
    });

    it('GET /events?localId= → 200 filtra por local', async () => {
      const localA = await seedLocal();
      const localB = await seedLocal();
      const adminA = await adminToken(localA);
      const adminB = await adminToken(localB);
      const inA = await createEvent(adminA.token, localA, 'en-a');
      const inB = await createEvent(adminB.token, localB, 'en-b');
      await http()
        .post(`/api/v1/events/${inA.id as string}/publish`)
        .set('Authorization', `Bearer ${adminA.token}`);
      await http()
        .post(`/api/v1/events/${inB.id as string}/publish`)
        .set('Authorization', `Bearer ${adminB.token}`);

      const res = await http().get('/api/v1/events').query({ localId: localA });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.localId).toBe(localA);
    });

    it('GET /events/:slug → 200 con la forma del DTO (público)', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      await createEvent(token, localId, 'detalle-evento');

      const res = await http().get('/api/v1/events/detalle-evento');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('detalle-evento');
      expect(res.body.name).toBe('Noche Techno');
      expect(res.body.localId).toBe(localId);
      expect(res.body.status).toBe('draft');
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.startsAt).toBe('string');
      expect(res.body.ticketsSold).toBe(0);
    });

    it('GET /events/:slug → 404 Problem+JSON si no existe', async () => {
      const res = await http().get('/api/v1/events/no-existe');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('events/event-not-found');
    });

    it('GET /events/:id/ticket-types → 200 lista (vacía) para un evento sin tipos', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      const created = await createEvent(token, localId, 'sin-tipos');

      const res = await http().get(`/api/v1/events/${created.id as string}/ticket-types`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('GET /events/:id/ticket-types → 400 si el id no es UUID (ParseUUIDPipe)', async () => {
      const res = await http().get('/api/v1/events/no-es-uuid/ticket-types');
      expect(res.status).toBe(400);
    });
  });

  describe('EventsController — POST /events (admin_local)', () => {
    it('POST /events → 401 sin token', async () => {
      const localId = await seedLocal();
      const res = await http().post('/api/v1/events').send(buildEventDto(localId));
      expect(res.status).toBe(401);
    });

    it('POST /events → 403 con rol insuficiente (user)', async () => {
      const localId = await seedLocal();
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(buildEventDto(localId));
      expect(res.status).toBe(403);
    });

    it('POST /events → 422 Problem+JSON con body inválido', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'x', slug: 'MAYÚSCULAS', startsAt: 'no-es-fecha' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /events → 201 admin_local crea el evento (+forma)', async () => {
      const localId = await seedLocal();
      const { token, userId } = await adminToken(localId);
      const res = await http()
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(buildEventDto(localId, 'evento-creado'));
      expect(res.status).toBe(201);
      expect(res.body.slug).toBe('evento-creado');
      expect(res.body.localId).toBe(localId);
      expect(res.body.status).toBe('draft');
      expect(res.body.totalCapacity).toBe(500);
      expect(typeof res.body.id).toBe('string');
      // created_by persiste el usuario autenticado (FK → user).
      const [row] = await client.sql<{ created_by: string }[]>`
        SELECT created_by FROM event WHERE id = ${res.body.id as string}`;
      expect(row?.created_by).toBe(userId);
    });
  });

  describe('EventsController — POST /events/:id/publish (admin_local)', () => {
    it('POST /events/:id/publish → 401 sin token', async () => {
      const res = await http().post(`/api/v1/events/${randomUUID()}/publish`);
      expect(res.status).toBe(401);
    });

    it('POST /events/:id/publish → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/events/${randomUUID()}/publish`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('POST /events/:id/publish → 404 si el evento no existe', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post(`/api/v1/events/${randomUUID()}/publish`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('events/event-not-found');
    });

    it('POST /events/:id/publish → 200 publica el evento', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      const created = await createEvent(token, localId, 'a-publicar');
      const res = await http()
        .post(`/api/v1/events/${created.id as string}/publish`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
      expect(res.body.publishedAt).not.toBeNull();
    });
  });

  describe('EventsController — POST /events/:id/cancel (admin_local)', () => {
    const REASON = { reason: 'Aforo no alcanzado' };

    it('POST /events/:id/cancel → 401 sin token', async () => {
      const res = await http().post(`/api/v1/events/${randomUUID()}/cancel`).send(REASON);
      expect(res.status).toBe(401);
    });

    it('POST /events/:id/cancel → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/events/${randomUUID()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send(REASON);
      expect(res.status).toBe(403);
    });

    it('POST /events/:id/cancel → 422 con body inválido', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post(`/api/v1/events/${randomUUID()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'x' });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /events/:id/cancel → 404 si el evento no existe', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post(`/api/v1/events/${randomUUID()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send(REASON);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('events/event-not-found');
    });

    it('POST /events/:id/cancel → 200 cancela el evento', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      const created = await createEvent(token, localId, 'a-cancelar');
      const res = await http()
        .post(`/api/v1/events/${created.id as string}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send(REASON);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });
  });

  describe('TicketTypesController — POST /ticket-types (admin_local)', () => {
    function buildTicketTypeDto(eventId: string) {
      return {
        eventId,
        name: 'Entrada General',
        tierCode: 'general',
        price: 50,
        currency: 'PEN',
        stock: 100,
        maxPerUser: 4,
      };
    }

    it('POST /ticket-types → 401 sin token', async () => {
      const res = await http().post('/api/v1/ticket-types').send(buildTicketTypeDto(randomUUID()));
      expect(res.status).toBe(401);
    });

    it('POST /ticket-types → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/ticket-types')
        .set('Authorization', `Bearer ${token}`)
        .send(buildTicketTypeDto(randomUUID()));
      expect(res.status).toBe(403);
    });

    it('POST /ticket-types → 422 Problem+JSON con body inválido', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post('/api/v1/ticket-types')
        .set('Authorization', `Bearer ${token}`)
        .send({ eventId: 'no-es-uuid', name: 'x', price: -5, stock: 0 });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /ticket-types → 404 si el evento no existe', async () => {
      const { token } = await adminToken();
      const res = await http()
        .post('/api/v1/ticket-types')
        .set('Authorization', `Bearer ${token}`)
        .send(buildTicketTypeDto(randomUUID()));
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('events/event-not-found');
    });

    it('POST /ticket-types → 201 admin_local crea el tipo de entrada (+forma)', async () => {
      const localId = await seedLocal();
      const { token } = await adminToken(localId);
      const event = await createEvent(token, localId, 'evento-con-tipos');
      const res = await http()
        .post('/api/v1/ticket-types')
        .set('Authorization', `Bearer ${token}`)
        .send(buildTicketTypeDto(event.id as string));
      expect(res.status).toBe(201);
      expect(res.body.eventId).toBe(event.id);
      expect(res.body.name).toBe('Entrada General');
      expect(res.body.tierCode).toBe('general');
      expect(res.body.stock).toBe(100);
      expect(res.body.sold).toBe(0);
      expect(res.body.remaining).toBe(100);
      expect(res.body.status).toBe('active');

      // El tipo creado aparece en el listado público del evento.
      const list = await http().get(`/api/v1/events/${event.id as string}/ticket-types`);
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]?.id).toBe(res.body.id);
    });
  });
});
