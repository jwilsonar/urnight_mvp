import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { DbClient } from '@urnight/db';
import request from 'supertest';
import {
  createE2EApp,
  seedRoles,
  signAccessToken,
} from '../../../../shared/testing/integration/e2e-app';
import {
  createTestDb,
  ensureTestDbMigrated,
  truncateIdentity,
} from '../../../../shared/testing/integration/test-db';
import { TokenService } from '../../domain/ports/token.port';

// E2E de todo el HTTP del BC Identity en UN archivo: comparten app + BD
// `urnight_test`, por lo que se ejecutan en serie (un solo fichero evita carreras).

let app: INestApplication;
let client: DbClient;

const REGISTER = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Urnight2026!',
  birthDate: '2000-01-01',
  documentType: 'dni',
  documentNumber: '12345678',
  acceptsMarketing: false,
};

beforeAll(async () => {
  await ensureTestDbMigrated();
  client = createTestDb();
  app = await createE2EApp(client);
}, 60000);

beforeEach(async () => {
  await truncateIdentity(client);
  await seedRoles(client);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

const http = () => request(app.getHttpServer());

/** Registra un usuario y devuelve su access token + id. */
async function registerUser(
  email = REGISTER.email,
  documentNumber = REGISTER.documentNumber,
): Promise<{ token: string; id: string }> {
  const reg = await http().post('/api/v1/auth/register').send({ ...REGISTER, email, documentNumber });
  const me = await http().get('/api/v1/auth/me').set('Authorization', `Bearer ${reg.body.accessToken}`);
  return { token: reg.body.accessToken, id: me.body.id };
}

describe('Identity HTTP (e2e)', () => {
  describe('AuthController', () => {
    it('POST /auth/register → 201 + par de tokens', async () => {
      const res = await http().post('/api/v1/auth/register').send(REGISTER);
      expect(res.status).toBe(201);
      expect(res.body.tokenType).toBe('Bearer');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
      expect(typeof res.body.expiresIn).toBe('number');
    });

    it('POST /auth/register → 422 Problem+JSON con body inválido', async () => {
      const res = await http().post('/api/v1/auth/register').send({});
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /auth/register → 422 con contraseña que no cumple la política', async () => {
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...REGISTER, password: 'supersecret' });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /auth/login → 200 con credenciales válidas', async () => {
      await http().post('/api/v1/auth/register').send(REGISTER);
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: REGISTER.email, password: REGISTER.password });
      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('POST /auth/login → 401 Problem+JSON con contraseña incorrecta', async () => {
      await http().post('/api/v1/auth/register').send(REGISTER);
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: REGISTER.email, password: 'incorrecta' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('identity/invalid-credentials');
    });

    it('GET /auth/me → 401 sin token', async () => {
      const res = await http().get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /auth/me → 200 con token, devuelve el perfil', async () => {
      const { token } = await registerUser();
      const res = await http().get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('ada@example.com');
      expect(res.body.roles).toContain('user');
      expect(res.body.onboardingCompleted).toBe(false);
    });

    it('POST /auth/verify-email → 200 marca verificado', async () => {
      const { id } = await registerUser();
      const verifyToken = await app.get(TokenService).signEmailVerification(id);
      const res = await http().post('/api/v1/auth/verify-email').send({ token: verifyToken });
      expect(res.status).toBe(200);
      expect(res.body.emailVerified).toBe(true);
    });
  });

  describe('PreferencesController (/me)', () => {
    it('PATCH /me/preferences → 401 sin token', async () => {
      const res = await http().patch('/api/v1/me/preferences').send({ acceptsMarketing: true });
      expect(res.status).toBe(401);
    });

    it('PATCH /me/preferences → 200 aplica el patch', async () => {
      const { token } = await registerUser();
      const res = await http()
        .patch('/api/v1/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ acceptsMarketing: true, preferredLocale: 'es-MX' });
      expect(res.status).toBe(200);
      expect(res.body.acceptsMarketing).toBe(true);
      expect(res.body.preferredLocale).toBe('es-MX');
    });

    it('PATCH /me/preferences → 422 con locale inválido', async () => {
      const { token } = await registerUser();
      const res = await http()
        .patch('/api/v1/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferredLocale: 'invalido' });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /me/onboarding → 200 completa el onboarding', async () => {
      const { token } = await registerUser();
      const res = await http()
        .post('/api/v1/me/onboarding')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.onboardingCompleted).toBe(true);
    });
  });

  describe('RolesController (/users/:userId/roles, super_admin)', () => {
    it('POST → 401 sin token', async () => {
      const res = await http().post(`/api/v1/users/${randomUUID()}/roles`).send({ roleCode: 'admin_local' });
      expect(res.status).toBe(401);
    });

    it('POST → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/users/${randomUUID()}/roles`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roleCode: 'admin_local' });
      expect(res.status).toBe(403);
    });

    it('POST → 201 super_admin otorga rol a un usuario', async () => {
      // El actor (granted_by) debe ser un usuario real por la FK user_role.granted_by → user.
      const adminUser = await registerUser('admin@example.com', '11111111');
      const target = await registerUser('target@example.com', '22222222');
      const adminToken = await signAccessToken(app, adminUser.id, ['super_admin']);
      const res = await http()
        .post(`/api/v1/users/${target.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleCode: 'admin_local' });
      expect(res.status).toBe(201);
      expect(res.body.roleCode).toBe('admin_local');
      expect(res.body.userId).toBe(target.id);
      expect(res.body.isActive).toBe(true);
    });

    it('POST → 422 con roleCode inválido', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post(`/api/v1/users/${randomUUID()}/roles`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ roleCode: 'jefe' });
      expect(res.status).toBe(422);
    });

    it('POST → 404 Problem+JSON si el usuario destino no existe', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post(`/api/v1/users/${randomUUID()}/roles`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ roleCode: 'admin_local' });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('identity/user-not-found');
    });

    it('DELETE → 204 super_admin revoca la asignación', async () => {
      const adminUser = await registerUser('admin@example.com', '11111111');
      const target = await registerUser('target@example.com', '22222222');
      const adminToken = await signAccessToken(app, adminUser.id, ['super_admin']);
      const granted = await http()
        .post(`/api/v1/users/${target.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleCode: 'admin_local' });

      const res = await http()
        .delete(`/api/v1/users/${target.id}/roles/${granted.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  describe('LegalController (/legal-documents)', () => {
    const PUBLISH = { docType: 'terms', version: '1.0', contentUrl: 'https://cdn.urnight.pe/terms-1.0.pdf' };

    it('GET /current → 404 cuando no hay vigente (público)', async () => {
      const res = await http().get('/api/v1/legal-documents/current').query({ docType: 'terms' });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('identity/legal-document-not-found');
    });

    it('POST → 401 sin token', async () => {
      const res = await http().post('/api/v1/legal-documents').send(PUBLISH);
      expect(res.status).toBe(401);
    });

    it('POST → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/legal-documents')
        .set('Authorization', `Bearer ${token}`)
        .send(PUBLISH);
      expect(res.status).toBe(403);
    });

    it('POST → 201 super_admin publica; GET /current → 200', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const pub = await http()
        .post('/api/v1/legal-documents')
        .set('Authorization', `Bearer ${admin}`)
        .send(PUBLISH);
      expect(pub.status).toBe(201);
      expect(pub.body.docType).toBe('terms');
      expect(pub.body.isCurrent).toBe(true);

      const current = await http().get('/api/v1/legal-documents/current').query({ docType: 'terms' });
      expect(current.status).toBe(200);
      expect(current.body.version).toBe('1.0');
    });

    it('POST → 422 con body inválido', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post('/api/v1/legal-documents')
        .set('Authorization', `Bearer ${admin}`)
        .send({ docType: 'terms', version: 'mala', contentUrl: 'no-es-url' });
      expect(res.status).toBe(422);
    });

    it('POST /:id/accept → 201 con usuario autenticado', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const pub = await http()
        .post('/api/v1/legal-documents')
        .set('Authorization', `Bearer ${admin}`)
        .send(PUBLISH);
      const user = await registerUser();

      const res = await http()
        .post(`/api/v1/legal-documents/${pub.body.id}/accept`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(201);
      expect(res.body.legalDocumentId).toBe(pub.body.id);
      expect(res.body.versionAccepted).toBe('1.0');
    });
  });
});
