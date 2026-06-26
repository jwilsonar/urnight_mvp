import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  company,
  type DbClient,
  event,
  local,
  report as reportTable,
  user,
} from '@urnight/db';
import { Report } from '../../domain/entities/report.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleReportRepository } from './drizzle-report.repository';

let client: DbClient;
let repo: DrizzleReportRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleReportRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeedIds {
  reporterUserId: string;
  resolverUserId: string;
  companyId: string;
  localId: string;
  eventId: string;
}

/** Siembra usuario(s)/company/local/event para satisfacer las FK de report. */
async function seedChain(): Promise<SeedIds> {
  const reporterUserId = randomUUID();
  const resolverUserId = randomUUID();
  const companyId = randomUUID();
  const localId = randomUUID();
  const eventId = randomUUID();

  await client.db.insert(user).values([
    { id: reporterUserId, fullName: 'Reportador', email: `rep-${reporterUserId}@example.com` },
    { id: resolverUserId, fullName: 'Moderador', email: `mod-${resolverUserId}@example.com` },
  ]);
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Empresa SAC',
    ruc: `${Date.now()}`.slice(0, 11).padEnd(11, '0'),
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

  return { reporterUserId, resolverUserId, companyId, localId, eventId };
}

describe('DrizzleReportRepository (integration)', () => {
  it('round-trip: create + findById devuelve el reporte fiel', async () => {
    const seed = await seedChain();
    const entity = Report.file({
      id: randomUUID(),
      reporterUserId: seed.reporterUserId,
      targetType: 'local',
      localId: seed.localId,
      reason: 'unsafe',
      comment: 'Inseguro',
      severity: 'high',
    });

    const created = await repo.create(entity);
    expect(created.id).toBe(entity.id);
    expect(created.status).toBe('open');

    const found = await repo.findById(entity.id);
    expect(found?.id).toBe(entity.id);
    expect(found?.reporterUserId).toBe(seed.reporterUserId);
    expect(found?.targetType).toBe('local');
    expect(found?.localId).toBe(seed.localId);
    expect(found?.eventId).toBeNull();
    expect(found?.reason).toBe('unsafe');
    expect(found?.comment).toBe('Inseguro');
    expect(found?.severity).toBe('high');
    expect(found?.status).toBe('open');
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it('findById devuelve null cuando el reporte no existe', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('update: resolve persiste estado/nota/resolvedBy (round-trip de actualización)', async () => {
    const seed = await seedChain();
    const entity = Report.file({
      id: randomUUID(),
      reporterUserId: seed.reporterUserId,
      targetType: 'event',
      eventId: seed.eventId,
      reason: 'cancelled',
      severity: 'medium',
    });
    await repo.create(entity);

    entity.resolve(seed.resolverUserId, 'Atendido por moderación');
    const updated = await repo.update(entity);
    expect(updated.status).toBe('resolved');

    const found = await repo.findById(entity.id);
    expect(found?.status).toBe('resolved');
    expect(found?.resolutionNote).toBe('Atendido por moderación');
    expect(found?.resolvedBy).toBe(seed.resolverUserId);
    expect(found?.eventId).toBe(seed.eventId);
    expect(found?.localId).toBeNull();
  });

  it('CHECK polimórfico: un report con local y event a la vez es rechazado', async () => {
    const seed = await seedChain();
    await expect(
      client.db.insert(reportTable).values({
        id: randomUUID(),
        reporterUserId: seed.reporterUserId,
        targetType: 'local',
        localId: seed.localId,
        eventId: seed.eventId,
        reason: 'other',
        severity: 'low',
        status: 'open',
      }),
    ).rejects.toThrow();
  });
});
