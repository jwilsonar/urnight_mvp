import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import { LegalDocumentBuilder } from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleLegalDocumentRepository } from './drizzle-legal-document.repository';

let client: DbClient;
let repo: DrizzleLegalDocumentRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleLegalDocumentRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

describe('DrizzleLegalDocumentRepository (integration)', () => {
  it('publish + findCurrent del tipo', async () => {
    const doc = new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build();
    await repo.publish(doc);

    const current = await repo.findCurrent('terms');
    expect(current?.id).toBe(doc.id);
    expect(current?.isCurrent).toBe(true);
  });

  it('publicar una nueva versión supersede la anterior (Tx + invariante 1 current/tipo)', async () => {
    const v1 = new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build();
    const v2 = new LegalDocumentBuilder().withDocType('terms').withVersion('2.0').build();
    await repo.publish(v1);
    await repo.publish(v2);

    const current = await repo.findCurrent('terms');
    expect(current?.version).toBe('2.0');
    expect((await repo.findById(v1.id))?.isCurrent).toBe(false);
  });

  it('UNIQUE (doc_type, version): republicar la misma versión es rechazado (rollback de Tx)', async () => {
    await repo.publish(new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build());
    await expect(
      repo.publish(new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build()),
    ).rejects.toThrow();
  });
});
