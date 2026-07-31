import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import {
  type DbClient,
  affiliationRequest as affiliationRequestTable,
  company as companyTable,
  local as localTable,
  localVerification as localVerificationTable,
  localVerificationDocument as localVerificationDocumentTable,
  user as userTable,
  zone as zoneTable,
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
import { FakeStorage } from '../../../../shared/testing/fakes/fake-storage';

// E2E de todo el HTTP del BC Companies en UN archivo, con base privada para
// poder correr en paralelo con otros BCs sin carreras (cada spec su propia BD).
const DB = 'urnight_test_e2e_companies';

let app: INestApplication;
let client: DbClient;
const storage = new FakeStorage();

beforeAll(async () => {
  await ensureNamedDbMigrated(DB);
  client = createNamedTestDb(DB);
  app = await createE2EApp(client, { storage });
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

/** Siembra una empresa (ancla de tenant; FK obligatoria de local.company_id). */
async function seedCompany(
  overrides: { id?: string; ruc?: string } = {},
): Promise<string> {
  const id = overrides.id ?? randomUUID();
  const ruc = overrides.ruc ?? '20100000001';
  await client.db.insert(companyTable).values({
    id,
    legalName: `Empresa ${ruc}`,
    ruc,
    commercialName: `Comercial ${ruc}`,
    status: 'active',
  });
  return id;
}

/** Siembra una zona (FK opcional de local.zone_id). */
async function seedZone(slug = 'miraflores'): Promise<string> {
  const id = randomUUID();
  await client.db.insert(zoneTable).values({ id, name: `Zona ${slug}`, slug });
  return id;
}

/** Siembra un local directamente en BD para fijar tenant/slug/estado. */
async function seedLocal(input: {
  companyId: string;
  zoneId?: string | null;
  slug?: string;
  status?: 'draft' | 'active' | 'inactive' | 'suspended';
}): Promise<string> {
  const id = randomUUID();
  await client.db.insert(localTable).values({
    id,
    companyId: input.companyId,
    zoneId: input.zoneId ?? null,
    name: 'Club Centro',
    slug: input.slug ?? `local-${id.slice(0, 8)}`,
    status: input.status ?? 'draft',
  });
  return id;
}

/** Siembra el usuario revisor. `local_verification.verified_by` es FK a `user.id`. */
async function seedReviewer(): Promise<string> {
  const id = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  await client.db.insert(userTable).values({
    id,
    fullName: `Revisor ${suffix}`,
    email: `revisor-${suffix}@example.com`,
  });
  return id;
}

/** Siembra una verificación pendiente para un local. */
async function seedVerification(localId: string): Promise<string> {
  const id = randomUUID();
  await client.db.insert(localVerificationTable).values({
    id,
    localId,
    status: 'pending',
    licenseReference: 'ITSE-2026-001',
  });
  return id;
}

/** Siembra una solicitud de afiliación pendiente. */
async function seedAffiliation(
  overrides: { ruc?: string } = {},
): Promise<string> {
  const id = randomUUID();
  await client.db.insert(affiliationRequestTable).values({
    id,
    legalName: 'Bar La Noche SAC',
    ruc: overrides.ruc ?? '20555555555',
    commercialName: 'La Noche',
    status: 'pending',
  });
  return id;
}

describe('Companies HTTP (e2e)', () => {
  describe('CompaniesController (/companies, super_admin)', () => {
    const CREATE = {
      legalName: 'Discoteca Lima SAC',
      ruc: '20100000123',
      commercialName: 'Lima Club',
      contactEmail: 'contacto@limaclub.pe',
      contactPhone: '987654321',
    };

    it('POST /companies → 401 sin token', async () => {
      const res = await http().post('/api/v1/companies').send(CREATE);
      expect(res.status).toBe(401);
    });

    it('POST /companies → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(CREATE);
      expect(res.status).toBe(403);
    });

    it('POST /companies → 422 Problem+JSON con body inválido', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${admin}`)
        .send({ legalName: 'X', ruc: 'no-es-ruc', commercialName: '' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /companies → 201 super_admin crea empresa (+ DTO)', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${admin}`)
        .send(CREATE);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.legalName).toBe('Discoteca Lima SAC');
      expect(res.body.ruc).toBe('20100000123');
      expect(res.body.commercialName).toBe('Lima Club');
      expect(res.body.contactEmail).toBe('contacto@limaclub.pe');
      expect(res.body.status).toBe('active');
      expect(typeof res.body.createdAt).toBe('string');
    });
  });

  describe('AffiliationController (/affiliation-requests)', () => {
    const SUBMIT = {
      legalName: 'Bar La Noche SAC',
      ruc: '20555555555',
      commercialName: 'La Noche',
      contactEmail: 'hola@lanoche.pe',
      contactPhone: '999111222',
      termsAccepted: true,
      legalDeclarationAccepted: true,
    };

    it('POST /affiliation-requests → 201 público envía solicitud (+ DTO)', async () => {
      const res = await http().post('/api/v1/affiliation-requests').send(SUBMIT);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.legalName).toBe('Bar La Noche SAC');
      expect(res.body.ruc).toBe('20555555555');
      expect(res.body.status).toBe('pending');
      expect(res.body.companyId).toBeNull();
      expect(res.body.localId).toBeNull();
    });

    it('POST /affiliation-requests → 422 Problem+JSON con body inválido', async () => {
      const res = await http()
        .post('/api/v1/affiliation-requests')
        .send({ legalName: 'X', ruc: '123', commercialName: '' });
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /:id/review → 401 sin token', async () => {
      const res = await http()
        .post(`/api/v1/affiliation-requests/${randomUUID()}/review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(401);
    });

    it('POST /:id/review → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/affiliation-requests/${randomUUID()}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(403);
    });

    it('POST /:id/review → 422 al rechazar sin motivo', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const id = await seedAffiliation();
      const res = await http()
        .post(`/api/v1/affiliation-requests/${id}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'rejected' });
      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
    });

    it('POST /:id/review → 404 Problem+JSON si la solicitud no existe', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post(`/api/v1/affiliation-requests/${randomUUID()}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('companies/affiliation-not-found');
    });

    it('POST /:id/review → 200 super_admin aprueba (crea empresa+local, + DTO)', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const id = await seedAffiliation();
      const res = await http()
        .post(`/api/v1/affiliation-requests/${id}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.status).toBe('approved');
      expect(res.body.companyId).not.toBeNull();
      expect(res.body.localId).not.toBeNull();
    });
  });

  describe('LocalsController (/locals)', () => {
    it('GET /locals → 200 lista pública (sin token)', async () => {
      const companyId = await seedCompany();
      await seedLocal({ companyId, slug: 'club-visible', status: 'active' });
      const res = await http().get('/api/v1/locals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]?.slug).toBe('club-visible');
    });

    it('GET /locals/:slug → 200 detalle público (+ DTO)', async () => {
      const companyId = await seedCompany();
      await seedLocal({ companyId, slug: 'club-detalle', status: 'active' });
      const res = await http().get('/api/v1/locals/club-detalle');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('club-detalle');
      expect(res.body.companyId).toBe(companyId);
      expect(res.body.status).toBe('active');
      expect(res.body.isVerified).toBe(false);
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('GET /locals/:slug → 404 Problem+JSON si no existe', async () => {
      const res = await http().get('/api/v1/locals/no-existe');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('companies/local-not-found');
    });

    describe('POST /locals (admin_local)', () => {
      const buildBody = (companyId: string) => ({
        companyId,
        name: 'Nuevo Local',
        slug: 'nuevo-local',
      });

      it('→ 401 sin token', async () => {
        const res = await http()
          .post('/api/v1/locals')
          .send(buildBody(randomUUID()));
        expect(res.status).toBe(401);
      });

      it('→ 403 con rol insuficiente (user)', async () => {
        const token = await signAccessToken(app, randomUUID(), ['user']);
        const res = await http()
          .post('/api/v1/locals')
          .set('Authorization', `Bearer ${token}`)
          .send(buildBody(randomUUID()));
        expect(res.status).toBe(403);
      });

      it('→ 422 Problem+JSON con body inválido', async () => {
        const companyId = await seedCompany();
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId,
        });
        const res = await http()
          .post('/api/v1/locals')
          .set('Authorization', `Bearer ${token}`)
          .send({ companyId, name: 'X', slug: 'Slug Con Mayusculas' });
        expect(res.status).toBe(422);
        expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
        expect(res.body.errors).toBeDefined();
      });

      it('→ 201 admin_local crea local en su empresa (+ DTO)', async () => {
        const companyId = await seedCompany();
        const zoneId = await seedZone();
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId,
        });
        const res = await http()
          .post('/api/v1/locals')
          .set('Authorization', `Bearer ${token}`)
          .send({ companyId, zoneId, name: 'Nuevo Local', slug: 'nuevo-local' });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.companyId).toBe(companyId);
        expect(res.body.zoneId).toBe(zoneId);
        expect(res.body.slug).toBe('nuevo-local');
        expect(res.body.status).toBe('draft');
        expect(res.body.isVerified).toBe(false);
      });

      it('→ 403 cross-tenant: admin_local de otra empresa no puede crear', async () => {
        const ownCompany = await seedCompany({ ruc: '20100000010' });
        const otherCompany = await seedCompany({ ruc: '20100000011' });
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: ownCompany,
        });
        const res = await http()
          .post('/api/v1/locals')
          .set('Authorization', `Bearer ${token}`)
          .send({ companyId: otherCompany, name: 'Intruso', slug: 'intruso' });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('companies/tenant-forbidden');
      });

      it('→ 404 si la empresa no existe (super_admin omite tenant)', async () => {
        const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
        const res = await http()
          .post('/api/v1/locals')
          .set('Authorization', `Bearer ${admin}`)
          .send({ companyId: randomUUID(), name: 'Fantasma', slug: 'fantasma' });
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('companies/company-not-found');
      });
    });

    describe('POST /locals/:id/publish (admin_local)', () => {
      it('→ 401 sin token', async () => {
        const res = await http().post(`/api/v1/locals/${randomUUID()}/publish`);
        expect(res.status).toBe(401);
      });

      it('→ 403 con rol insuficiente (user)', async () => {
        const token = await signAccessToken(app, randomUUID(), ['user']);
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/publish`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
      });

      it('→ 404 si el local no existe', async () => {
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: randomUUID(),
        });
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/publish`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('companies/local-not-found');
      });

      it('→ 403 cross-tenant: admin_local de otra empresa no puede publicar', async () => {
        const ownCompany = await seedCompany({ ruc: '20100000020' });
        const otherCompany = await seedCompany({ ruc: '20100000021' });
        const localId = await seedLocal({ companyId: otherCompany, slug: 'ajeno' });
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: ownCompany,
        });
        const res = await http()
          .post(`/api/v1/locals/${localId}/publish`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('companies/tenant-forbidden');
      });

      it('→ 200 admin_local publica su local (+ DTO)', async () => {
        const companyId = await seedCompany();
        const localId = await seedLocal({ companyId, slug: 'a-publicar' });
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId,
        });
        const res = await http()
          .post(`/api/v1/locals/${localId}/publish`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(localId);
        expect(res.body.status).toBe('active');
      });
    });

    describe('POST /locals/:id/suspend (admin_local)', () => {
      const REASON = { reason: 'Aforo excedido' };

      it('→ 401 sin token', async () => {
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/suspend`)
          .send(REASON);
        expect(res.status).toBe(401);
      });

      it('→ 403 con rol insuficiente (user)', async () => {
        const token = await signAccessToken(app, randomUUID(), ['user']);
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/suspend`)
          .set('Authorization', `Bearer ${token}`)
          .send(REASON);
        expect(res.status).toBe(403);
      });

      it('→ 422 Problem+JSON con motivo inválido', async () => {
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: randomUUID(),
        });
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/suspend`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'x' });
        expect(res.status).toBe(422);
        expect(res.body.errors).toBeDefined();
      });

      it('→ 404 si el local no existe', async () => {
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: randomUUID(),
        });
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/suspend`)
          .set('Authorization', `Bearer ${token}`)
          .send(REASON);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('companies/local-not-found');
      });

      it('→ 200 admin_local suspende el local (+ DTO)', async () => {
        const companyId = await seedCompany();
        const localId = await seedLocal({ companyId, slug: 'a-suspender', status: 'active' });
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId,
        });
        const res = await http()
          .post(`/api/v1/locals/${localId}/suspend`)
          .set('Authorization', `Bearer ${token}`)
          .send(REASON);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(localId);
        expect(res.body.status).toBe('suspended');
      });
    });

    describe('POST /locals/:id/verifications (admin_local)', () => {
      const REQUEST = { licenseReference: 'ITSE-2026-XYZ' };

      it('→ 401 sin token', async () => {
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/verifications`)
          .send(REQUEST);
        expect(res.status).toBe(401);
      });

      it('→ 403 con rol insuficiente (user)', async () => {
        const token = await signAccessToken(app, randomUUID(), ['user']);
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/verifications`)
          .set('Authorization', `Bearer ${token}`)
          .send(REQUEST);
        expect(res.status).toBe(403);
      });

      it('→ 422 Problem+JSON con body inválido', async () => {
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: randomUUID(),
        });
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/verifications`)
          .set('Authorization', `Bearer ${token}`)
          .send({ documentUrl: 'no-es-url' });
        expect(res.status).toBe(422);
        expect(res.body.errors).toBeDefined();
      });

      it('→ 404 si el local no existe', async () => {
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId: randomUUID(),
        });
        const res = await http()
          .post(`/api/v1/locals/${randomUUID()}/verifications`)
          .set('Authorization', `Bearer ${token}`)
          .send(REQUEST);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('companies/local-not-found');
      });

      it('→ 201 admin_local solicita verificación (+ DTO)', async () => {
        const companyId = await seedCompany();
        const localId = await seedLocal({ companyId, slug: 'a-verificar' });
        const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
          companyId,
        });
        const res = await http()
          .post(`/api/v1/locals/${localId}/verifications`)
          .set('Authorization', `Bearer ${token}`)
          .send({ licenseReference: 'ITSE-2026-XYZ', validUntil: '2027-12-31' });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.localId).toBe(localId);
        expect(res.body.status).toBe('pending');
        expect(res.body.licenseReference).toBe('ITSE-2026-XYZ');
      });
    });
  });

  describe('Documentos de verificación de local', () => {
    it('presign + confirm persiste solo la key y respeta el tenant', async () => {
      const companyId = await seedCompany();
      const otherCompanyId = await seedCompany({ ruc: '20100000999' });
      const localId = await seedLocal({
        companyId,
        slug: 'documentos-tenant',
        status: 'active',
      });
      const token = await signAccessToken(app, randomUUID(), ['admin_local'], {
        companyId,
      });
      const presign = await http()
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          scope: 'verificationDocument',
          contentType: 'application/pdf',
          sizeBytes: 2048,
        });
      expect(presign.status).toBe(200);
      expect(presign.body.key).toMatch(/^tmp\/.+\.pdf$/);
      storage.seed(presign.body.key, {
        sizeBytes: 2048,
        contentType: 'application/pdf',
      });

      const confirmed = await http()
        .post(`/api/v1/locals/${localId}/verification-documents`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: presign.body.key,
          documentType: 'municipal_license',
          issuedAt: '2026-01-01',
          expiresAt: '2027-01-01',
        });
      expect(confirmed.status).toBe(201);
      expect(confirmed.body.reviewStatus).toBe('pending');
      expect(confirmed.body.lifecycleStatus).toBe('pending');
      expect(confirmed.body.downloadUrl).toContain(
        `/locals/${localId}/verification/`,
      );

      const [stored] = await client.db
        .select()
        .from(localVerificationDocumentTable);
      expect(stored?.storageKey).toMatch(
        new RegExp(`^locals/${localId}/verification/`),
      );
      expect(stored?.storageKey).not.toMatch(/^https?:/);

      const list = await http()
        .get(`/api/v1/locals/${localId}/verification-documents`)
        .set('Authorization', `Bearer ${token}`);
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);

      const otherToken = await signAccessToken(
        app,
        randomUUID(),
        ['admin_local'],
        { companyId: otherCompanyId },
      );
      const forbidden = await http()
        .get(`/api/v1/locals/${localId}/verification-documents`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(forbidden.status).toBe(403);
    });

    it('super_admin lista y aprueba documentos; dos requeridos verifican la ficha pública', async () => {
      const reviewerId = await seedReviewer();
      const token = await signAccessToken(app, reviewerId, ['super_admin']);
      const companyId = await seedCompany();
      const localId = await seedLocal({
        companyId,
        slug: 'documentos-aprobados',
        status: 'active',
      });
      const verificationId = await seedVerification(localId);
      const documentIds = [randomUUID(), randomUUID()];
      await client.db.insert(localVerificationDocumentTable).values([
        {
          id: documentIds[0],
          localVerificationId: verificationId,
          documentType: 'municipal_license',
          storageKey: `locals/${localId}/verification/license.pdf`,
          issuedAt: '2026-01-01',
          expiresAt: '2027-01-01',
        },
        {
          id: documentIds[1],
          localVerificationId: verificationId,
          documentType: 'itse_certificate',
          storageKey: `locals/${localId}/verification/itse.pdf`,
          issuedAt: '2026-01-01',
          expiresAt: '2027-01-01',
        },
      ]);

      const pending = await http()
        .get('/api/v1/local-verification-documents/pending')
        .set('Authorization', `Bearer ${token}`);
      expect(pending.status).toBe(200);
      expect(pending.body).toHaveLength(2);

      const invalidRejection = await http()
        .post(
          `/api/v1/local-verification-documents/${documentIds[0]}/review`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ decision: 'rejected' });
      expect(invalidRejection.status).toBe(422);

      for (const documentId of documentIds) {
        const reviewed = await http()
          .post(`/api/v1/local-verification-documents/${documentId}/review`)
          .set('Authorization', `Bearer ${token}`)
          .send({ decision: 'approved' });
        expect(reviewed.status).toBe(200);
        expect(reviewed.body.reviewStatus).toBe('approved');
      }

      const detail = await http().get(
        '/api/v1/locals/documentos-aprobados',
      );
      expect(detail.status).toBe(200);
      expect(detail.body.isVerified).toBe(true);
      expect(detail.body.verificationStatus).toBe('approved');
    });
  });

  describe('LocalVerificationsController (/local-verifications, super_admin)', () => {
    it('POST /:id/review → 401 sin token', async () => {
      const res = await http()
        .post(`/api/v1/local-verifications/${randomUUID()}/review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(401);
    });

    it('POST /:id/review → 403 con rol insuficiente (user)', async () => {
      const token = await signAccessToken(app, randomUUID(), ['user']);
      const res = await http()
        .post(`/api/v1/local-verifications/${randomUUID()}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(403);
    });

    it('POST /:id/review → 422 Problem+JSON con decisión inválida', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post(`/api/v1/local-verifications/${randomUUID()}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'quizas' });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /:id/review → 404 Problem+JSON si la verificación no existe', async () => {
      const admin = await signAccessToken(app, randomUUID(), ['super_admin']);
      const res = await http()
        .post(`/api/v1/local-verifications/${randomUUID()}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('companies/verification-not-found');
    });

    it('POST /:id/review → 200 super_admin aprueba y marca el local verificado', async () => {
      // El revisor tiene que existir: local_verification.verified_by es FK a user.id.
      const admin = await signAccessToken(app, await seedReviewer(), ['super_admin']);
      const companyId = await seedCompany();
      const localId = await seedLocal({ companyId, slug: 'verificable', status: 'active' });
      const verificationId = await seedVerification(localId);
      const res = await http()
        .post(`/api/v1/local-verifications/${verificationId}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(verificationId);
      expect(res.body.localId).toBe(localId);
      expect(res.body.status).toBe('approved');

      // El local queda verificado (efecto derivado).
      const detail = await http().get('/api/v1/locals/verificable');
      expect(detail.body.isVerified).toBe(true);
    });
  });
});
