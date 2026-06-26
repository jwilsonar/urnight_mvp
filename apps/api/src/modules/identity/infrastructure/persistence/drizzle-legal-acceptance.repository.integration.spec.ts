import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import type { LegalDocument } from '../../domain/entities/legal-document.entity';
import type { User } from '../../domain/entities/user.entity';
import {
  LegalAcceptanceBuilder,
  LegalDocumentBuilder,
  UserBuilder,
} from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleLegalAcceptanceRepository } from './drizzle-legal-acceptance.repository';
import { DrizzleLegalDocumentRepository } from './drizzle-legal-document.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';

let client: DbClient;
let repo: DrizzleLegalAcceptanceRepository;
let users: DrizzleUserRepository;
let documents: DrizzleLegalDocumentRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleLegalAcceptanceRepository(client.db);
  users = new DrizzleUserRepository(client.db);
  documents = new DrizzleLegalDocumentRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra usuario + documento legal (FK de legal_acceptance). */
async function seedUserAndDoc(): Promise<{ user: User; doc: LegalDocument }> {
  const user = new UserBuilder().build();
  await users.create(user);
  const doc = await documents.publish(
    new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build(),
  );
  return { user, doc };
}

describe('DrizzleLegalAcceptanceRepository (integration)', () => {
  it('round-trip: create + findByUser conserva el snapshot de versión', async () => {
    const { user, doc } = await seedUserAndDoc();
    await repo.create(
      new LegalAcceptanceBuilder()
        .withUserId(user.id)
        .withLegalDocumentId(doc.id)
        .withVersionAccepted(doc.version)
        .withIpAddress('8.8.8.8')
        .build(),
    );

    const list = await repo.findByUser(user.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.legalDocumentId).toBe(doc.id);
    expect(list[0]?.versionAccepted).toBe('1.0');
    expect(list[0]?.ipAddress).toBe('8.8.8.8');
  });

  it('UNIQUE (user_id, legal_document_id): aceptar dos veces el mismo doc es rechazado', async () => {
    const { user, doc } = await seedUserAndDoc();
    await repo.create(
      new LegalAcceptanceBuilder().withUserId(user.id).withLegalDocumentId(doc.id).build(),
    );
    await expect(
      repo.create(
        new LegalAcceptanceBuilder().withUserId(user.id).withLegalDocumentId(doc.id).build(),
      ),
    ).rejects.toThrow();
  });
});
