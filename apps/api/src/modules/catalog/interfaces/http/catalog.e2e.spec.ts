import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { DbClient } from '@urnight/db';
import request from 'supertest';
import { createE2EApp, seedRoles } from '../../../../shared/testing/integration/e2e-app';
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';

// E2E de todo el HTTP del BC Catalog en UN archivo. Usa una BD PRIVADA
// (`urnight_test_e2e_catalog`) para ser seguro en paralelo con otros specs.
// Todos los controllers son @Public() (catálogo de lectura abierto en Fase 1),
// así que no hay casos 401/403 ni recursos por id (no hay 404).

const DB = 'urnight_test_e2e_catalog';

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

/** Body válido para crear una zona/taxonomía (createZoneSchema). */
const VALID_ZONE = {
  name: 'Miraflores',
  slug: 'miraflores',
  displayOrder: 1,
  isActive: true,
};

/** Casos de error de validación Zod compartidos por todos los recursos. */
const INVALID_BODIES: ReadonlyArray<{ desc: string; body: Record<string, unknown> }> = [
  { desc: 'body vacío', body: {} },
  { desc: 'name demasiado corto', body: { name: 'a', slug: 'ok-slug' } },
  { desc: 'slug no kebab-case', body: { name: 'Centro', slug: 'No Valido' } },
  { desc: 'displayOrder negativo', body: { name: 'Centro', slug: 'centro', displayOrder: -1 } },
];

/** Aserta la forma del DTO de respuesta de una zona/taxonomía. */
function expectZoneShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string');
  expect(typeof body.name).toBe('string');
  expect(typeof body.slug).toBe('string');
  expect(typeof body.displayOrder).toBe('number');
  expect(typeof body.isActive).toBe('boolean');
  expect(typeof body.createdAt).toBe('string');
  expect(typeof body.updatedAt).toBe('string');
}

/**
 * Suite parametrizada: los 4 recursos (zones + 3 taxonomías) comparten el
 * mismo contrato (GET listar / POST crear con createZoneSchema).
 */
const RESOURCES = ['zones', 'local-types', 'music-genres', 'tags'] as const;

describe('Catalog HTTP (e2e)', () => {
  for (const resource of RESOURCES) {
    describe(`/${resource}`, () => {
      it(`GET /${resource} → 200 devuelve una lista vacía sin token (público)`, async () => {
        const res = await http().get(`/api/v1/${resource}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
      });

      it(`POST /${resource} → 201 crea el recurso y devuelve el DTO`, async () => {
        const res = await http().post(`/api/v1/${resource}`).send(VALID_ZONE);
        expect(res.status).toBe(201);
        expectZoneShape(res.body);
        expect(res.body.name).toBe(VALID_ZONE.name);
        expect(res.body.slug).toBe(VALID_ZONE.slug);
        expect(res.body.displayOrder).toBe(VALID_ZONE.displayOrder);
        expect(res.body.isActive).toBe(true);
      });

      it(`POST /${resource} → 201 aplica los valores por defecto (displayOrder/isActive)`, async () => {
        const res = await http()
          .post(`/api/v1/${resource}`)
          .send({ name: 'Barranco', slug: 'barranco' });
        expect(res.status).toBe(201);
        expect(res.body.displayOrder).toBe(0);
        expect(res.body.isActive).toBe(true);
      });

      it(`GET /${resource} → 200 lista el recurso recién creado`, async () => {
        await http().post(`/api/v1/${resource}`).send(VALID_ZONE);
        const res = await http().get(`/api/v1/${resource}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]?.slug).toBe(VALID_ZONE.slug);
      });

      for (const { desc, body } of INVALID_BODIES) {
        it(`POST /${resource} → 422 Problem+JSON con ${desc}`, async () => {
          const res = await http().post(`/api/v1/${resource}`).send(body);
          expect(res.status).toBe(422);
          expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
          expect(res.body.status).toBe(422);
          expect(res.body.errors).toBeDefined();
        });
      }
    });
  }
});
