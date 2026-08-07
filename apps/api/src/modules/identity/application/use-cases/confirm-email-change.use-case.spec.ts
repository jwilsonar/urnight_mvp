import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  FakeTokenService,
  InMemoryUserRepository,
  UserBuilder,
  captureEvents,
} from '../../../../shared/testing';
import { InvalidTokenError } from '../../domain/errors/identity.errors';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { ConfirmEmailChangeUseCase } from './confirm-email-change.use-case';

const USER_ID = '77777777-7777-4777-8777-777777777777';

async function build() {
  const users = new InMemoryUserRepository();
  await users.create(
    new UserBuilder().withId(USER_ID).withEmail('actual@example.test').build(),
  );
  const tokens = new FakeTokenService();
  const events = new EventBus();
  const refresh = new InMemoryRefreshTokenStore();
  await refresh.store(USER_ID, 'active-session', 3600);
  const useCase = new ConfirmEmailChangeUseCase(users, tokens, events, refresh);
  return { events, refresh, tokens, useCase, users };
}

describe('ConfirmEmailChangeUseCase', () => {
  it('un token de cambio de correo vencido produce InvalidTokenError', async () => {
    const { tokens, useCase } = await build();
    const token = await tokens.signEmailChange({
      sub: USER_ID,
      newEmail: 'nuevo@example.test',
    });
    tokens.emailChangeExpired = true;

    await expect(useCase.execute({ token })).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('aplica el correo verificado, publica evento y revoca sesiones', async () => {
    const { events, refresh, tokens, useCase, users } = await build();
    const captured = captureEvents(events, 'identity.email.changed');
    const token = await tokens.signEmailChange({
      sub: USER_ID,
      newEmail: 'nuevo@example.test',
    });

    await useCase.execute({ token });

    const user = await users.findById(USER_ID);
    expect(user?.email).toBe('nuevo@example.test');
    expect(user?.emailVerified).toBe(true);
    expect(captured.names()).toEqual(['identity.email.changed']);
    expect(refresh.countFor(USER_ID)).toBe(0);
  });
});
