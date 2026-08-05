import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  company,
  local,
  localVerification,
  localVerificationDocument,
  platformSetting,
  role,
  user,
  userRole,
  type DbClient,
} from '@urnight/db';
import { MaintenanceProcessor } from '../../../../../../worker/src/maintenance/maintenance.processor';
import {
  createNamedTestDb,
  ensureNamedDbMigrated,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';

const DB_NAME = 'urnight_test_int_local_verification_maintenance';

let client: DbClient;

beforeAll(async () => {
  await ensureNamedDbMigrated(DB_NAME);
  client = createNamedTestDb(DB_NAME);
});

beforeEach(async () => {
  await truncateAll(client);
});

afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

describe('mantenimiento documental de locales (Postgres real)', () => {
  it('degrada vencidos y encola un solo aviso aunque el job corra dos veces', async () => {
    const queueCalls: Array<{ name: string; data: unknown; jobId?: string }> = [];
    const queue = {
      add: async (
        name: string,
        data: unknown,
        options?: { jobId?: string },
      ) => {
        queueCalls.push({ name, data, jobId: options?.jobId });
        return {};
      },
    } as unknown as ConstructorParameters<
      typeof MaintenanceProcessor
    >[1];
    const processor = new MaintenanceProcessor(client.db, queue);
    const adminRoleId = randomUUID();
    const adminId = randomUUID();
    const companyId = randomUUID();
    const expiredLocalId = randomUUID();
    const warningLocalId = randomUUID();
    await client.db.insert(role).values({
      id: adminRoleId,
      code: 'admin_local',
      name: 'Administrador local',
    });
    await client.db.insert(user).values({
      id: adminId,
      fullName: 'Administradora Demo',
      email: 'owner@example.com',
    });
    await client.db.insert(company).values({
      id: companyId,
      legalName: 'Empresa Demo SAC',
      ruc: '20123456789',
      commercialName: 'Empresa Demo',
      status: 'active',
    });
    await client.db.insert(userRole).values({
      userId: adminId,
      roleId: adminRoleId,
      companyId,
    });
    await client.db.insert(local).values([
      {
        id: expiredLocalId,
        companyId,
        name: 'Local vencido',
        slug: 'local-vencido',
        status: 'active',
        isVerified: true,
      },
      {
        id: warningLocalId,
        companyId,
        name: 'Local por vencer',
        slug: 'local-por-vencer',
        status: 'active',
        isVerified: true,
      },
    ]);
    const expiredVerificationId = randomUUID();
    const warningVerificationId = randomUUID();
    await client.db.insert(localVerification).values([
      {
        id: expiredVerificationId,
        localId: expiredLocalId,
        status: 'approved',
      },
      {
        id: warningVerificationId,
        localId: warningLocalId,
        status: 'approved',
      },
    ]);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const inTenDays = new Date(today);
    inTenDays.setUTCDate(inTenDays.getUTCDate() + 10);
    const nextYear = new Date(today);
    nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
    const date = (value: Date) => value.toISOString().slice(0, 10);
    await client.db.insert(localVerificationDocument).values([
      {
        localVerificationId: expiredVerificationId,
        documentType: 'municipal_license',
        storageKey: 'locals/expired/license.pdf',
        issuedAt: '2025-01-01',
        expiresAt: date(yesterday),
        reviewStatus: 'approved',
      },
      {
        localVerificationId: expiredVerificationId,
        documentType: 'itse_certificate',
        storageKey: 'locals/expired/itse.pdf',
        issuedAt: '2025-01-01',
        expiresAt: date(nextYear),
        reviewStatus: 'approved',
      },
      {
        localVerificationId: warningVerificationId,
        documentType: 'municipal_license',
        storageKey: 'locals/warning/license.pdf',
        issuedAt: '2026-01-01',
        expiresAt: date(inTenDays),
        reviewStatus: 'approved',
      },
      {
        localVerificationId: warningVerificationId,
        documentType: 'itse_certificate',
        storageKey: 'locals/warning/itse.pdf',
        issuedAt: '2026-01-01',
        expiresAt: date(nextYear),
        reviewStatus: 'approved',
      },
    ]);
    await client.db.insert(platformSetting).values([
      {
        key: 'verification_required_document_types',
        value: '["municipal_license","itse_certificate"]',
        valueType: 'json',
      },
      {
        key: 'verification_expiry_warning_days',
        value: '30',
        valueType: 'number',
      },
    ]);

    const job = {
      name: 'maintain-local-verifications',
    } as Parameters<MaintenanceProcessor['process']>[0];
    await expect(processor.process(job)).resolves.toEqual({
      degraded: 1,
      warningsQueued: 1,
    });
    await expect(processor.process(job)).resolves.toEqual({
      degraded: 0,
      warningsQueued: 0,
    });

    const rows = await client.db.select().from(local);
    expect(rows.find((row) => row.id === expiredLocalId)?.isVerified).toBe(false);
    expect(rows.find((row) => row.id === warningLocalId)?.isVerified).toBe(true);
    expect(queueCalls).toHaveLength(1);
    expect(queueCalls[0]?.jobId).toContain(adminId);
  });
});
