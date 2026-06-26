import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company, local } from '@urnight/db';
import { Event } from '../../domain/entities/event.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleEventRepository } from './drizzle-event.repository';

let client: DbClient;
let repo: DrizzleEventRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleEventRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra company + local (necesarios por la FK event.local_id → local.id). */
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

function buildEvent(localId: string, overrides: Partial<{ slug: string }> = {}): Event {
  const suffix = randomUUID().slice(0, 8);
  return Event.create({
    id: randomUUID(),
    localId,
    name: `Fiesta ${suffix}`,
    slug: overrides.slug ?? `fiesta-${suffix}`,
    startsAt: new Date('2026-07-01T22:00:00.000Z'),
    totalCapacity: 500,
  });
}

describe('DrizzleEventRepository (integration)', () => {
  it('round-trip: create + findById conserva identidad y campos', async () => {
    const localId = await seedLocal();
    const event = buildEvent(localId, { slug: 'noche-techno' });
    await repo.create(event);

    const found = await repo.findById(event.id);
    expect(found).not.toBeNull();
    expect(found?.localId).toBe(localId);
    expect(found?.slug).toBe('noche-techno');
    expect(found?.totalCapacity).toBe(500);
    expect(found?.status).toBe('draft');
  });

  it('findBySlug / existsBySlug resuelven por slug', async () => {
    const localId = await seedLocal();
    const event = buildEvent(localId, { slug: 'open-air' });
    await repo.create(event);

    expect((await repo.findBySlug('open-air'))?.id).toBe(event.id);
    expect(await repo.existsBySlug('open-air')).toBe(true);
    expect(await repo.existsBySlug('inexistente')).toBe(false);
  });

  it('UNIQUE slug: el segundo evento con el mismo slug es rechazado por la BD', async () => {
    const localId = await seedLocal();
    await repo.create(buildEvent(localId, { slug: 'duplicado' }));
    await expect(repo.create(buildEvent(localId, { slug: 'duplicado' }))).rejects.toThrow();
  });

  it('listPublished devuelve solo los eventos publicados', async () => {
    const localId = await seedLocal();
    const draft = buildEvent(localId, { slug: 'borrador' });
    const published = buildEvent(localId, { slug: 'publicado' });
    published.publish();
    await repo.create(draft);
    await repo.create(published);
    await repo.update(published);

    const list = await repo.listPublished();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(published.id);
    expect(list[0]?.status).toBe('published');
  });

  it('listPublished filtra por local (published-by-local)', async () => {
    const localA = await seedLocal();
    const localB = await seedLocal();
    const inA = buildEvent(localA, { slug: 'en-a' });
    const inB = buildEvent(localB, { slug: 'en-b' });
    inA.publish();
    inB.publish();
    await repo.create(inA);
    await repo.create(inB);
    await repo.update(inA);
    await repo.update(inB);

    const list = await repo.listPublished({ localId: localA });
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(inA.id);
    expect(list[0]?.localId).toBe(localA);
  });

  it('update persiste mutaciones del aggregate (publish → status + publishedAt)', async () => {
    const localId = await seedLocal();
    const event = buildEvent(localId, { slug: 'mutable' });
    await repo.create(event);
    event.publish();
    await repo.update(event);

    const found = await repo.findById(event.id);
    expect(found?.status).toBe('published');
    expect(found?.publishedAt).not.toBeNull();
  });
});
