import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  FakeTokenService,
  InMemoryUserRepository,
  UserBuilder,
  captureEvents,
} from '../../../../shared/testing';
import { InvalidTokenError } from '../../domain/errors/identity.errors';
import { VerifyEmailUseCase } from './verify-email.use-case';

function build() {
  const users = new InMemoryUserRepository();
  const tokens = new FakeTokenService();
  const events = new EventBus();
  const useCase = new VerifyEmailUseCase(users, tokens, events);
  return { users, tokens, events, useCase };
}

describe('VerifyEmailUseCase', () => {
  it('verifica el email, persiste y emite EmailVerifiedEvent', async () => {
    const { users, tokens, events, useCase } = build();
    const user = new UserBuilder().withId('u1').build();
    await users.create(user);
    const captured = captureEvents(events, 'identity.email_verified');
    const token = await tokens.signEmailVerification(user.id);

    const result = await useCase.execute({ token });

    expect(result.emailVerified).toBe(true);
    expect((await users.findById('u1'))?.emailVerified).toBe(true);
    expect(captured.names()).toContain('identity.email_verified');
  });

  it('es idempotente: si ya estaba verificado no re-emite el evento', async () => {
    const { users, tokens, events, useCase } = build();
    const user = new UserBuilder().asGoogle().withId('u2').build(); // google → emailVerified=true
    await users.create(user);
    const captured = captureEvents(events, 'identity.email_verified');
    const token = await tokens.signEmailVerification(user.id);

    const result = await useCase.execute({ token });

    expect(result.emailVerified).toBe(true);
    expect(captured.events).toHaveLength(0);
  });

  it('token válido pero usuario inexistente → InvalidTokenError', async () => {
    const { tokens, useCase } = build();
    const token = await tokens.signEmailVerification('ghost');
    await expect(useCase.execute({ token })).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
