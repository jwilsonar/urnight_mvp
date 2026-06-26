import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { type DbClient, user as userTable } from '@urnight/db';
import request from 'supertest';
import { createE2EApp, seedRoles, signAccessToken } from '../../../../shared/testing/integration/e2e-app';
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import type { RoleCode } from '../../../identity/domain/entities/role.entity';

// E2E de todo el HTTP del BC Ops en UN archivo. Usa una BD PRIVADA
// (`urnight_test_e2e_ops`) para ser seguro en paralelo con otros specs.
// Cubre platform-settings (super_admin), support-tickets (admin_local/super_admin),
// notifications (autenticado) y analytics (público).

const DB = 'urnight_test_e2e_ops';

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

let userSeq = 0;

/**
 * Persiste un usuario real (FK: support_ticket.opened_by, platform_setting.updated_by,
 * notification.user_id, analytics_event.user_id) y firma un token con su id real y
 * los roles indicados.
 */
async function seedUser(roles: RoleCode[] = ['user']): Promise<{ id: string; token: string }> {
  userSeq += 1;
  const id = randomUUID();
  await client.db.insert(userTable).values({
    id,
    fullName: `Ops Tester ${userSeq}`,
    email: `ops-${userSeq}-${id}@example.com`,
  });
  const token = await signAccessToken(app, id, roles);
  return { id, token };
}

describe('Ops HTTP (e2e)', () => {
  describe('PlatformSettingsController (/platform-settings)', () => {
    const VALID = { key: 'feature.flag', value: 'true', valueType: 'boolean' as const };

    it('GET /:key → 404 Problem+JSON si la key no existe (público)', async () => {
      const res = await http().get('/api/v1/platform-settings/desconocida');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.code).toBe('ops/setting-not-found');
    });

    it('PUT → 401 sin token', async () => {
      const res = await http().put('/api/v1/platform-settings').send(VALID);
      expect(res.status).toBe(401);
    });

    it('PUT → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${token}`)
        .send(VALID);
      expect(res.status).toBe(403);
    });

    it('PUT → 403 con rol insuficiente (admin_local)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['admin_local']);
      const res = await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${token}`)
        .send(VALID);
      expect(res.status).toBe(403);
    });

    it('PUT → 422 Problem+JSON con body inválido', async () => {
      const admin = await seedUser(['super_admin']);
      const res = await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ key: 'a', valueType: 'invalido' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.status).toBe(422);
      expect(res.body?.errors).toBeDefined();
    });

    it('PUT → 200 super_admin hace upsert; GET /:key → 200 lo devuelve', async () => {
      const admin = await seedUser(['super_admin']);
      const put = await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(VALID);
      expect(put.status).toBe(200);
      expect(put.body?.key).toBe(VALID.key);
      expect(put.body?.value).toBe('true');
      expect(put.body?.valueType).toBe('boolean');
      expect(typeof put.body?.updatedAt).toBe('string');

      const get = await http().get(`/api/v1/platform-settings/${VALID.key}`);
      expect(get.status).toBe(200);
      expect(get.body?.key).toBe(VALID.key);
      expect(get.body?.value).toBe('true');
    });

    it('PUT → 200 actualiza el valor existente (upsert por key)', async () => {
      const admin = await seedUser(['super_admin']);
      await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(VALID);
      const update = await http()
        .put('/api/v1/platform-settings')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ key: VALID.key, value: 'false', valueType: 'boolean' });
      expect(update.status).toBe(200);
      expect(update.body?.value).toBe('false');
    });
  });

  describe('SupportTicketsController (/support-tickets)', () => {
    const VALID = {
      subject: 'No abre la puerta NFC',
      description: 'El lector falla en la entrada principal',
      category: 'incident' as const,
      priority: 'high' as const,
    };

    it('POST → 401 sin token', async () => {
      const res = await http().post('/api/v1/support-tickets').send(VALID);
      expect(res.status).toBe(401);
    });

    it('POST → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/support-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(VALID);
      expect(res.status).toBe(403);
    });

    it('POST → 422 Problem+JSON con body inválido', async () => {
      const opener = await seedUser(['admin_local']);
      const res = await http()
        .post('/api/v1/support-tickets')
        .set('Authorization', `Bearer ${opener.token}`)
        .send({ subject: 'ab', category: 'no-existe' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.status).toBe(422);
      expect(res.body?.errors).toBeDefined();
    });

    it('POST → 201 admin_local abre el ticket y devuelve el DTO', async () => {
      const opener = await seedUser(['admin_local']);
      const res = await http()
        .post('/api/v1/support-tickets')
        .set('Authorization', `Bearer ${opener.token}`)
        .send(VALID);
      expect(res.status).toBe(201);
      expect(typeof res.body?.id).toBe('string');
      expect(typeof res.body?.ticketCode).toBe('string');
      expect(res.body?.subject).toBe(VALID.subject);
      expect(res.body?.category).toBe('incident');
      expect(res.body?.status).toBe('open');
      expect(res.body?.priority).toBe('high');
      expect(typeof res.body?.createdAt).toBe('string');
    });

    it('POST /:id/status → 401 sin token', async () => {
      const res = await http()
        .post(`/api/v1/support-tickets/${randomUUID()}/status`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(401);
    });

    it('POST /:id/status → 403 con rol insuficiente (admin_local)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['admin_local']);
      const res = await http()
        .post(`/api/v1/support-tickets/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(403);
    });

    it('POST /:id/status → 422 Problem+JSON con status inválido', async () => {
      const admin = await seedUser(['super_admin']);
      const res = await http()
        .post(`/api/v1/support-tickets/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'open' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.status).toBe(422);
      expect(res.body?.errors).toBeDefined();
    });

    it('POST /:id/status → 404 Problem+JSON si el ticket no existe', async () => {
      const admin = await seedUser(['super_admin']);
      const res = await http()
        .post(`/api/v1/support-tickets/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.code).toBe('ops/support-ticket-not-found');
    });

    it('POST → 201 + POST /:id/status → 200 super_admin resuelve el ticket', async () => {
      const opener = await seedUser(['admin_local']);
      const created = await http()
        .post('/api/v1/support-tickets')
        .set('Authorization', `Bearer ${opener.token}`)
        .send(VALID);
      expect(created.status).toBe(201);

      const admin = await seedUser(['super_admin']);
      const res = await http()
        .post(`/api/v1/support-tickets/${created.body?.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(200);
      expect(res.body?.id).toBe(created.body?.id);
      expect(res.body?.status).toBe('resolved');
    });
  });

  describe('NotificationsController (/notifications)', () => {
    it('GET /me → 401 sin token', async () => {
      const res = await http().get('/api/v1/notifications/me');
      expect(res.status).toBe(401);
    });

    it('GET /me → 200 lista vacía para un usuario sin notificaciones', async () => {
      const me = await seedUser(['user']);
      const res = await http()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${me.token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('GET /me → 200 devuelve solo las notificaciones del usuario autenticado', async () => {
      const me = await seedUser(['user']);
      const other = await seedUser(['user']);
      await client.sql`
        INSERT INTO notification (user_id, channel, type, subject, status)
        VALUES (${me.id}, 'email', 'welcome', 'Bienvenido', 'sent')`;
      await client.sql`
        INSERT INTO notification (user_id, channel, type, subject, status)
        VALUES (${other.id}, 'push', 'promo', 'Oferta', 'queued')`;

      const res = await http()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${me.token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.type).toBe('welcome');
      expect(res.body[0]?.channel).toBe('email');
      expect(res.body[0]?.subject).toBe('Bienvenido');
      expect(res.body[0]?.status).toBe('sent');
      expect(typeof res.body[0]?.id).toBe('string');
      expect(typeof res.body[0]?.createdAt).toBe('string');
    });
  });

  describe('AnalyticsController (/analytics)', () => {
    const VALID = { eventName: 'page_view', sessionId: 'sess-123' };

    it('POST /events → 202 anónimo (público, sin token)', async () => {
      const res = await http().post('/api/v1/analytics/events').send(VALID);
      expect(res.status).toBe(202);
      expect(res.body?.recorded).toBe(true);
    });

    it('POST /events → 202 autenticado (asocia el evento al usuario)', async () => {
      const me = await seedUser(['user']);
      const res = await http()
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${me.token}`)
        .send(VALID);
      expect(res.status).toBe(202);
      expect(res.body?.recorded).toBe(true);
    });

    it('POST /events → 422 Problem+JSON con body inválido', async () => {
      const res = await http()
        .post('/api/v1/analytics/events')
        .send({ eventName: 'a', eventId: 'no-es-uuid' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body?.status).toBe(422);
      expect(res.body?.errors).toBeDefined();
    });
  });
});
