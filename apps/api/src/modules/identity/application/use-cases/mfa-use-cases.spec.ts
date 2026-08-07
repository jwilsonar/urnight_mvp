import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  FakePasswordHasher,
  FakeTokenService,
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  UserBuilder,
} from '../../../../shared/testing';
import {
  InvalidMfaCodeError,
  MfaChallengeExpiredError,
  MfaClockDriftError,
  MfaNotEnrolledError,
} from '../../domain/errors/identity.errors';
import { InMemoryMfaRepository } from '../services/__testing__/in-memory-mfa-repository';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { FakeTotp } from '../services/__testing__/fake-totp';
import { RoleResolver } from '../services/role-resolver.service';
import { TokenIssuer } from '../services/token-issuer.service';
import { ConfirmMfaEnrollmentUseCase } from './confirm-mfa-enrollment.use-case';
import { GetMfaStatusUseCase } from './get-mfa-status.use-case';
import { RegenerateRecoveryCodesUseCase } from './regenerate-recovery-codes.use-case';
import { RevokeMfaUseCase } from './revoke-mfa.use-case';
import { StartMfaEnrollmentUseCase } from './start-mfa-enrollment.use-case';
import { UnlockMfaUseCase } from './unlock-mfa.use-case';
import { UseRecoveryCodeUseCase } from './use-recovery-code.use-case';
import { VerifyMfaChallengeUseCase } from './verify-mfa-challenge.use-case';

const PASSWORD = 'Urnight2026!';

async function build() {
  const users = new InMemoryUserRepository();
  const user = new UserBuilder()
    .withId('11111111-1111-4111-8111-111111111111')
    .withEmail('ada@example.com')
    .withPasswordHash(`hashed:${PASSWORD}`)
    .build();
  await users.create(user);
  const mfa = new InMemoryMfaRepository();
  const totp = new FakeTotp();
  const hasher = new FakePasswordHasher();
  const issuer = new TokenIssuer(
    new RoleResolver(new InMemoryRoleAssignmentRepository(), new InMemoryRoleRepository()),
    new FakeTokenService(),
    new InMemoryRefreshTokenStore(),
    mfa,
  );
  return { users, user, mfa, totp, hasher, issuer };
}

describe('MFA use cases', () => {
  it('inicia enrolamiento y devuelve el secreto exactamente en esa respuesta', async () => {
    const { users, user, mfa, totp } = await build();
    const useCase = new StartMfaEnrollmentUseCase(mfa, totp, users);

    const result = await useCase.execute({ userId: user.id });

    expect(result).toEqual({
      secret: totp.secret,
      otpauthUri: expect.stringContaining(`secret=${totp.secret}`),
    });
    expect((await mfa.findCurrentFactor(user.id))?.status).toBe('pending');
  });

  // Regresión: rotar el secreto en cada visita invalidaba un QR ya escaneado y
  // dejaba a la persona en un bucle de "código inválido" sin explicación.
  it('reutiliza el factor pendiente en vez de rotar el secreto ya escaneado', async () => {
    const { users, user, mfa, totp } = await build();
    const useCase = new StartMfaEnrollmentUseCase(mfa, totp, users);

    const primera = await useCase.execute({ userId: user.id });
    const idInicial = (await mfa.findCurrentFactor(user.id))?.id;
    const segunda = await useCase.execute({ userId: user.id });

    expect(segunda.secret).toBe(primera.secret);
    expect(segunda.otpauthUri).toBe(primera.otpauthUri);
    expect((await mfa.findCurrentFactor(user.id))?.id).toBe(idInicial);
  });

  it('confirma con TOTP válido, activa el factor y devuelve diez recovery codes una sola vez', async () => {
    const { users, user, mfa, totp, hasher } = await build();
    await new StartMfaEnrollmentUseCase(mfa, totp, users).execute({ userId: user.id });
    const useCase = new ConfirmMfaEnrollmentUseCase(mfa, totp, hasher);

    const result = await useCase.execute({ userId: user.id, code: totp.validCode });

    expect(result.recoveryCodes).toHaveLength(10);
    expect(new Set(result.recoveryCodes).size).toBe(10);
    expect((await mfa.findActiveFactor(user.id))?.status).toBe('active');
    expect(JSON.stringify(result)).not.toContain(totp.secret);
  });

  it('rechaza el primer código TOTP inválido sin activar el factor', async () => {
    const { users, user, mfa, totp, hasher } = await build();
    await new StartMfaEnrollmentUseCase(mfa, totp, users).execute({ userId: user.id });

    await expect(
      new ConfirmMfaEnrollmentUseCase(mfa, totp, hasher).execute({
        userId: user.id,
        code: '000000',
      }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);
    expect(await mfa.hasActiveFactor(user.id)).toBe(false);
  });

  // Regresión: con el reloj del servidor corrido, un código correcto se
  // rechazaba como "inválido" y no había forma de saber que el problema era la
  // hora. Ahora el error nombra la causa.
  it('distingue el reloj desfasado de un código equivocado al confirmar', async () => {
    const { users, user, mfa, totp, hasher } = await build();
    await new StartMfaEnrollmentUseCase(mfa, totp, users).execute({ userId: user.id });

    await expect(
      new ConfirmMfaEnrollmentUseCase(mfa, totp, hasher).execute({
        userId: user.id,
        code: totp.driftedCode,
      }),
    ).rejects.toBeInstanceOf(MfaClockDriftError);
    expect(await mfa.hasActiveFactor(user.id)).toBe(false);
  });

  it('un código válido emite sesión y consume el desafío', async () => {
    const { users, user, mfa, totp, issuer } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const challengeId = '22222222-2222-4222-8222-222222222222';
    await mfa.storeChallenge({
      id: challengeId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 300_000),
    });
    const useCase = new VerifyMfaChallengeUseCase(mfa, totp, users, issuer);

    const result = await useCase.execute({ challengeId, code: totp.validCode });

    expect(result.access.token).toBe(`access:${user.id}`);
    expect(await mfa.findChallenge(challengeId)).toBeNull();
  });

  it('un código inválido no emite sesión ni consume el desafío', async () => {
    const { users, user, mfa, totp, issuer } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const challengeId = '33333333-3333-4333-8333-333333333333';
    await mfa.storeChallenge({
      id: challengeId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 300_000),
    });

    await expect(
      new VerifyMfaChallengeUseCase(mfa, totp, users, issuer).execute({
        challengeId,
        code: '000000',
      }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);
    expect(await mfa.findChallenge(challengeId)).not.toBeNull();
  });

  it('reporta el reloj desfasado en el login sin consumir el desafío', async () => {
    const { users, user, mfa, totp, issuer } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const challengeId = '44444444-4444-4444-8444-444444444444';
    await mfa.storeChallenge({
      id: challengeId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 300_000),
    });

    await expect(
      new VerifyMfaChallengeUseCase(mfa, totp, users, issuer).execute({
        challengeId,
        code: totp.driftedCode,
      }),
    ).rejects.toBeInstanceOf(MfaClockDriftError);
    expect(await mfa.findChallenge(challengeId)).not.toBeNull();
  });

  it('un desafío vencido falla aunque el TOTP sea correcto', async () => {
    const { users, user, mfa, totp, issuer } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const challengeId = '44444444-4444-4444-8444-444444444444';
    await mfa.storeChallenge({
      id: challengeId,
      userId: user.id,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(
      new VerifyMfaChallengeUseCase(mfa, totp, users, issuer).execute({
        challengeId,
        code: totp.validCode,
      }),
    ).rejects.toBeInstanceOf(MfaChallengeExpiredError);
  });

  it('un recovery code emite sesión exactamente una vez', async () => {
    const { users, user, mfa, totp, hasher, issuer } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const recoveryCode = 'AAAAA-BBBBB-CCCCC-DDDDD';
    await mfa.replaceRecoveryCodes(user.id, [await hasher.hash(recoveryCode)], new Date());
    const useCase = new UseRecoveryCodeUseCase(mfa, hasher, users, issuer);

    await mfa.storeChallenge({
      id: '55555555-5555-4555-8555-555555555555',
      userId: user.id,
      expiresAt: new Date(Date.now() + 300_000),
    });
    const first = await useCase.execute({
      challengeId: '55555555-5555-4555-8555-555555555555',
      recoveryCode,
    });
    expect(first.access.token).toBe(`access:${user.id}`);

    await mfa.storeChallenge({
      id: '66666666-6666-4666-8666-666666666666',
      userId: user.id,
      expiresAt: new Date(Date.now() + 300_000),
    });
    await expect(
      useCase.execute({
        challengeId: '66666666-6666-4666-8666-666666666666',
        recoveryCode,
      }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);
  });

  it('revoca solo tras verificar la contraseña actual', async () => {
    const { users, user, mfa, totp, hasher } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const useCase = new RevokeMfaUseCase(mfa, users, hasher);

    await useCase.execute({ userId: user.id, password: PASSWORD });

    expect(await mfa.hasActiveFactor(user.id)).toBe(false);
    await expect(useCase.execute({ userId: user.id, password: PASSWORD })).rejects.toBeInstanceOf(
      MfaNotEnrolledError,
    );
  });

  it('regenera diez recovery codes tras reautenticar e invalida los anteriores', async () => {
    const { users, user, mfa, totp, hasher } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    await mfa.replaceRecoveryCodes(user.id, ['hashed:old'], new Date());

    const result = await new RegenerateRecoveryCodesUseCase(mfa, users, hasher).execute({
      userId: user.id,
      password: PASSWORD,
    });

    expect(result.recoveryCodes).toHaveLength(10);
    expect(await mfa.countUnusedRecoveryCodes(user.id)).toBe(10);
  });

  it('devuelve el estado sin revelar el secreto', async () => {
    const { user, mfa, totp } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);

    const result = await new GetMfaStatusUseCase(mfa).execute({ userId: user.id });

    expect(result.enrolled).toBe(true);
    expect(JSON.stringify(result)).not.toContain(totp.secret);
  });

  it('unlock falla para super_admin no incluido en mfa_unlock_operator', async () => {
    const { user, mfa, totp } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const useCase = new UnlockMfaUseCase(mfa);

    await expect(
      useCase.execute({
        actorUserId: '77777777-7777-4777-8777-777777777777',
        actorRoles: ['super_admin'],
        targetUserId: user.id,
        reason: 'Perdió dispositivo y códigos',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('unlock exige rol y operador, y revoca el factor del objetivo', async () => {
    const { user, mfa, totp } = await build();
    mfa.seedActiveFactor(user.id, totp.secret);
    const actorUserId = '88888888-8888-4888-8888-888888888888';
    mfa.seedUnlockOperator(actorUserId);
    const useCase = new UnlockMfaUseCase(mfa);

    await useCase.execute({
      actorUserId,
      actorRoles: ['super_admin'],
      targetUserId: user.id,
      reason: 'Perdió dispositivo y códigos',
    });

    expect(await mfa.hasActiveFactor(user.id)).toBe(false);
  });
});
