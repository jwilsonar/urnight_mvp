import { describe, expect, it } from 'vitest';
import {
  FakeEmailPort,
  InMemoryOtpCodeStore,
  InMemoryUserRepository,
  UserBuilder,
} from '../../../../shared/testing';
import {
  MfaEmailResendTooSoonError,
  MfaEmailUnavailableError,
} from '../../domain/errors/identity.errors';
import { InMemoryMfaRepository } from '../services/__testing__/in-memory-mfa-repository';
import { SendMfaEmailCodeUseCase } from './send-mfa-email-code.use-case';

const CHALLENGE_ID = '11111111-1111-4111-8111-111111111111';

async function build(emailVerified = true) {
  const users = new InMemoryUserRepository();
  const user = new UserBuilder()
    .withId('22222222-2222-4222-8222-222222222222')
    .withEmail('pia@example.test')
    .build();
  if (emailVerified) user.markEmailVerified();
  await users.create(user);
  const mfa = new InMemoryMfaRepository();
  await mfa.storeChallenge({
    id: CHALLENGE_ID,
    userId: user.id,
    expiresAt: new Date(Date.now() + 300_000),
  });
  const otp = new InMemoryOtpCodeStore();
  const email = new FakeEmailPort();
  const useCase = new SendMfaEmailCodeUseCase(mfa, users, otp, email);
  return { email, otp, useCase };
}

describe('SendMfaEmailCodeUseCase', () => {
  it('rechaza el respaldo por correo cuando el email no esta verificado', async () => {
    const { email, useCase } = await build(false);

    await expect(useCase.execute({ challengeId: CHALLENGE_ID })).rejects.toBeInstanceOf(
      MfaEmailUnavailableError,
    );
    expect(email.messages).toHaveLength(0);
  });

  it('emite un codigo de seis digitos y devuelve solo el correo enmascarado', async () => {
    const { email, useCase } = await build();

    const result = await useCase.execute({ challengeId: CHALLENGE_ID });

    expect(result.sentTo).toBe('pi***@example.test');
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(result.resendAvailableAt).getTime()).toBeGreaterThan(Date.now());
    expect(email.messages).toHaveLength(1);
    expect(email.messages[0]?.body).toMatch(/\b\d{6}\b/);
  });

  it('bloquea el reenvio antes de sesenta segundos', async () => {
    const { email, useCase } = await build();
    await useCase.execute({ challengeId: CHALLENGE_ID });

    await expect(useCase.execute({ challengeId: CHALLENGE_ID })).rejects.toBeInstanceOf(
      MfaEmailResendTooSoonError,
    );
    expect(email.messages).toHaveLength(1);
  });
});
