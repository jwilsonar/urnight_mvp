import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  mfaUnlockOperator,
  role as roleTable,
  type DbClient,
  userRole,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Env } from '../../../../config/env.schema';
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
import { FakeTotp } from '../../application/services/__testing__/fake-totp';
import type { RoleCode } from '../../domain/entities/role.entity';
import { AesGcmSecretCipher } from '../../infrastructure/auth/aes-gcm-secret-cipher';

let app: INestApplication;
let client: DbClient;
const totp = new FakeTotp();
const PASSWORD = 'Urnight2026!';

const http = () => request(app.getHttpServer());

beforeAll(async () => {
  await ensureTestDbMigrated();
  client = createTestDb();
  const key = Buffer.alloc(32, 9).toString('base64');
  const config = { get: () => key } as unknown as ConfigService<Env, true>;
  app = await createE2EApp(client, {
    totp,
    mfaCipher: new AesGcmSecretCipher(config),
  });
}, 60_000);

beforeEach(async () => {
  await truncateIdentity(client);
  await seedRoles(client);
});

afterAll(async () => {
  await app.close();
  await client.sql.end({ timeout: 5 });
});

async function registerUser(
  suffix: string,
): Promise<{ id: string; token: string; email: string }> {
  const email = `${suffix}@example.com`;
  const response = await http()
    .post('/api/v1/auth/register')
    .send({
      fullName: `Usuario ${suffix}`,
      email,
      password: PASSWORD,
      birthDate: '2000-01-01',
      documentType: 'dni',
      documentNumber: suffix.padEnd(8, '0').slice(0, 8),
      acceptsMarketing: false,
    });
  const me = await http()
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${response.body.accessToken}`);
  return { id: me.body.id, token: response.body.accessToken, email };
}

async function grantRole(userId: string, roleCode: RoleCode): Promise<void> {
  const [role] = await client.db
    .select({ id: roleTable.id })
    .from(roleTable)
    .where(eq(roleTable.code, roleCode))
    .limit(1);
  if (!role) throw new Error(`Rol ${roleCode} no sembrado`);
  await client.db.insert(userRole).values({ userId, roleId: role.id });
}

async function login(email: string) {
  return http().post('/api/v1/auth/login').send({ email, password: PASSWORD });
}

describe('MFA HTTP (e2e)', () => {
  it('completa enrolamiento, desafío TOTP, recovery de un uso, regeneración y revocación', async () => {
    const user = await registerUser('10000001');

    const enrollment = await http()
      .post('/api/v1/mfa/enroll')
      .set('Authorization', `Bearer ${user.token}`);
    expect(enrollment.status).toBe(200);
    expect(enrollment.body.secret).toBe(totp.secret);

    const confirmation = await http()
      .post('/api/v1/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ code: totp.validCode });
    expect(confirmation.status).toBe(200);
    expect(confirmation.body.recoveryCodes).toHaveLength(10);
    expect(JSON.stringify(confirmation.body)).not.toContain(totp.secret);

    const challenged = await login(user.email);
    expect(challenged.body.kind).toBe('mfa_challenge');
    expect(challenged.body.accessToken).toBeUndefined();
    expect(challenged.body.result).toBeUndefined();

    const invalid = await http().post('/api/v1/auth/mfa/verify').send({
      challengeId: challenged.body.challengeId,
      code: '000000',
    });
    expect(invalid.status).toBe(401);
    expect(invalid.body.code).toBe('identity/invalid-mfa-code');

    const verified = await http().post('/api/v1/auth/mfa/verify').send({
      challengeId: challenged.body.challengeId,
      code: totp.validCode,
    });
    expect(verified.status).toBe(200);
    expect(typeof verified.body.accessToken).toBe('string');

    const recoveryChallenge = await login(user.email);
    const recoveryCode = confirmation.body.recoveryCodes[0];
    const recovered = await http().post('/api/v1/auth/mfa/recovery').send({
      challengeId: recoveryChallenge.body.challengeId,
      recoveryCode,
    });
    expect(recovered.status).toBe(200);

    const replayChallenge = await login(user.email);
    const replay = await http().post('/api/v1/auth/mfa/recovery').send({
      challengeId: replayChallenge.body.challengeId,
      recoveryCode,
    });
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('identity/invalid-mfa-code');

    const regenerated = await http()
      .post('/api/v1/mfa/recovery-codes')
      .set('Authorization', `Bearer ${verified.body.accessToken}`)
      .send({ password: PASSWORD });
    expect(regenerated.status).toBe(200);
    expect(regenerated.body.recoveryCodes).toHaveLength(10);
    expect(JSON.stringify(regenerated.body)).not.toContain(totp.secret);

    const badRevoke = await http()
      .post('/api/v1/mfa/revoke')
      .set('Authorization', `Bearer ${verified.body.accessToken}`)
      .send({ password: 'incorrecta' });
    expect(badRevoke.status).toBe(401);

    const revoked = await http()
      .post('/api/v1/mfa/revoke')
      .set('Authorization', `Bearer ${verified.body.accessToken}`)
      .send({ password: PASSWORD });
    expect(revoked.status).toBe(204);

    const status = await http()
      .get('/api/v1/mfa/status')
      .set('Authorization', `Bearer ${verified.body.accessToken}`);
    expect(status.body).toEqual({
      enrolled: false,
      type: null,
      confirmedAt: null,
      recoveryCodesLeft: 0,
    });
  }, 90_000);

  it('admin_local pendiente queda restringido al enrolamiento; promoter no se bloquea', async () => {
    const admin = await registerUser('10000002');
    await grantRole(admin.id, 'admin_local');
    const adminLogin = await login(admin.email);
    expect(adminLogin.body.kind).toBe('session');
    const pendingToken = adminLogin.body.result.accessToken;

    const panel = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${pendingToken}`);
    expect(panel.status).toBe(401);
    expect(panel.body.code).toBe('identity/mfa-required');

    const enroll = await http()
      .post('/api/v1/mfa/enroll')
      .set('Authorization', `Bearer ${pendingToken}`);
    expect(enroll.status).toBe(200);

    const promoter = await registerUser('10000003');
    await grantRole(promoter.id, 'promoter');
    const promoterLogin = await login(promoter.email);
    expect(promoterLogin.body.kind).toBe('session');
    const promoterMe = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${promoterLogin.body.result.accessToken}`);
    expect(promoterMe.status).toBe(200);
  });

  it('unlock exige super_admin y fila explícita de operador', async () => {
    const target = await registerUser('10000004');
    await http()
      .post('/api/v1/mfa/enroll')
      .set('Authorization', `Bearer ${target.token}`);
    await http()
      .post('/api/v1/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${target.token}`)
      .send({ code: totp.validCode });

    const actor = await registerUser('10000005');
    await grantRole(actor.id, 'super_admin');
    const actorToken = await signAccessToken(app, actor.id, ['super_admin']);
    const payload = { userId: target.id, reason: 'Perdió dispositivo y códigos' };

    const forbidden = await http()
      .post('/api/v1/mfa/unlock')
      .set('Authorization', `Bearer ${actorToken}`)
      .send(payload);
    expect(forbidden.status).toBe(403);

    await client.db.insert(mfaUnlockOperator).values({
      userId: actor.id,
      grantedBy: actor.id,
    });
    const unlocked = await http()
      .post('/api/v1/mfa/unlock')
      .set('Authorization', `Bearer ${actorToken}`)
      .send(payload);
    expect(unlocked.status).toBe(204);

    const status = await http()
      .get('/api/v1/mfa/status')
      .set('Authorization', `Bearer ${target.token}`);
    expect(status.body.enrolled).toBe(false);
  });
});
