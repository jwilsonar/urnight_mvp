import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  FakeTokenService,
  InMemoryOtpCodeStore,
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  UserBuilder,
} from '../../../../shared/testing';
import {
  MfaEmailCodeExpiredError,
  MfaEmailCodeInvalidError,
} from '../../domain/errors/identity.errors';
import { InMemoryMfaRepository } from '../services/__testing__/in-memory-mfa-repository';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { RoleResolver } from '../services/role-resolver.service';
import { TokenIssuer } from '../services/token-issuer.service';
import { VerifyMfaEmailCodeUseCase } from './verify-mfa-email-code.use-case';

const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
const CODE = '123456';

async function build() {
  const users = new InMemoryUserRepository();
  const user = new UserBuilder()
    .withId('44444444-4444-4444-8444-444444444444')
    .withEmail('mfa@example.test')
    .build();
  user.markEmailVerified();
  await users.create(user);
  const mfa = new InMemoryMfaRepository();
  await mfa.storeChallenge({
    id: CHALLENGE_ID,
    userId: user.id,
    expiresAt: new Date(Date.now() + 300_000),
  });
  const otp = new InMemoryOtpCodeStore();
  await otp.issue(
    CHALLENGE_ID,
    createHash('sha256').update(CODE).digest('hex'),
    600,
  );
  const issuer = new TokenIssuer(
    new RoleResolver(new InMemoryRoleAssignmentRepository(), new InMemoryRoleRepository()),
    new FakeTokenService(),
    new InMemoryRefreshTokenStore(),
    mfa,
  );
  return {
    mfa,
    otp,
    useCase: new VerifyMfaEmailCodeUseCase(mfa, users, otp, issuer),
    user,
  };
}

describe('VerifyMfaEmailCodeUseCase', () => {
  it('un codigo incorrecto suma un intento y conserva el desafio', async () => {
    const { mfa, otp, useCase } = await build();

    await expect(
      useCase.execute({ challengeId: CHALLENGE_ID, code: '000000' }),
    ).rejects.toBeInstanceOf(MfaEmailCodeInvalidError);

    expect(await otp.attempts(CHALLENGE_ID)).toBe(1);
    expect(await mfa.findChallenge(CHALLENGE_ID)).not.toBeNull();
  });

  it('invalida el codigo al sexto intento fallido', async () => {
    const { otp, useCase } = await build();

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await expect(
        useCase.execute({ challengeId: CHALLENGE_ID, code: '000000' }),
      ).rejects.toBeInstanceOf(MfaEmailCodeInvalidError);
    }

    expect(await otp.attempts(CHALLENGE_ID)).toBe(6);
    await expect(
      useCase.execute({ challengeId: CHALLENGE_ID, code: CODE }),
    ).rejects.toBeInstanceOf(MfaEmailCodeExpiredError);
  });

  it('consume el codigo y el desafio antes de emitir la sesion', async () => {
    const { mfa, useCase, user } = await build();

    const result = await useCase.execute({ challengeId: CHALLENGE_ID, code: CODE });

    expect(result.access.token).toBe(`access:${user.id}`);
    expect(await mfa.findChallenge(CHALLENGE_ID)).toBeNull();
  });
});
