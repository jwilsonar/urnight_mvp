import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  FakeGoogleVerifier,
  FakeTokenService,
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserPreferenceRepository,
  InMemoryUserRepository,
  RecordingOutbox,
  RoleMother,
  UserBuilder,
  captureEvents,
  fakeUnitOfWork,
} from '../../../../shared/testing';
import {
  AccountDisabledError,
  GoogleEmailNotVerifiedError,
  GoogleTokenInvalidError,
} from '../../domain/errors/identity.errors';
import type { GoogleProfile } from '../../domain/ports/google-verifier.port';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { RoleResolver } from '../services/role-resolver.service';
import { TokenIssuer } from '../services/token-issuer.service';
import { UserProvisioningService } from '../services/user-provisioning.service';
import { GoogleLoginUseCase } from './google-login.use-case';

const profile: GoogleProfile = {
  sub: 'google-sub-1',
  email: 'grace@example.com',
  emailVerified: true,
  name: 'Grace Hopper',
  picture: null,
};

function build(googleProfile: GoogleProfile | null = profile) {
  const users = new InMemoryUserRepository();
  const preferences = new InMemoryUserPreferenceRepository();
  const assignments = new InMemoryRoleAssignmentRepository();
  const roles = new InMemoryRoleRepository().seed(RoleMother.user());
  const google = new FakeGoogleVerifier(googleProfile);
  const tokens = new FakeTokenService();
  const events = new EventBus();
  const outbox = new RecordingOutbox();
  const provisioning = new UserProvisioningService(
    users,
    preferences,
    roles,
    assignments,
    fakeUnitOfWork(),
    events,
    outbox,
  );
  const issuer = new TokenIssuer(
    new RoleResolver(assignments, roles),
    tokens,
    new InMemoryRefreshTokenStore(),
  );
  const useCase = new GoogleLoginUseCase(users, google, issuer, provisioning);
  return { users, preferences, assignments, roles, events, outbox, useCase };
}

describe('GoogleLoginUseCase', () => {
  it('alta nueva: crea usuario + preferencias + rol, emite UserRegistered y encola welcome', async () => {
    const { users, preferences, assignments, outbox, events, useCase } = build();
    const captured = captureEvents(events, 'identity.user_registered');

    const result = await useCase.execute({ idToken: 'valid-token' });

    expect(users.size).toBe(1);
    expect(preferences.size).toBe(1);
    expect(assignments.size).toBe(1);
    expect(result.user.email).toBe('grace@example.com');
    expect(result.user.authProvider).toBe('google');
    expect(captured.names()).toContain('identity.user_registered');
    expect(outbox.byName('send-welcome-email')).toBeDefined();
  });

  it('login por google_sub existente: no crea cuenta ni reemite registro', async () => {
    const { users, outbox, events, useCase } = build();
    const existing = new UserBuilder()
      .withId('u1')
      .withEmail('grace@example.com')
      .asGoogle('google-sub-1')
      .build();
    await users.create(existing);
    const captured = captureEvents(events, 'identity.user_registered');

    const result = await useCase.execute({ idToken: 'valid-token' });

    expect(result.user.id).toBe('u1');
    expect(users.size).toBe(1);
    expect(captured.events).toHaveLength(0);
    expect(outbox.jobs).toHaveLength(0);
  });

  it('vincula una cuenta de email existente con su google_sub', async () => {
    const { users, useCase } = build();
    const existing = new UserBuilder().withId('u2').withEmail('grace@example.com').build();
    await users.create(existing);

    const result = await useCase.execute({ idToken: 'valid-token' });

    expect(result.user.id).toBe('u2');
    expect((await users.findById('u2'))?.googleSub).toBe('google-sub-1');
  });

  it('cuenta deshabilitada → AccountDisabledError', async () => {
    const { users, useCase } = build();
    const existing = new UserBuilder()
      .withId('u3')
      .withEmail('grace@example.com')
      .asGoogle('google-sub-1')
      .asInactive()
      .build();
    await users.create(existing);
    await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toBeInstanceOf(
      AccountDisabledError,
    );
  });

  it('ID token inválido → GoogleTokenInvalidError (ACL)', async () => {
    const { useCase } = build(null);
    await expect(useCase.execute({ idToken: 'bad' })).rejects.toBeInstanceOf(
      GoogleTokenInvalidError,
    );
  });

  it('email_verified=false → GoogleEmailNotVerifiedError sin crear cuenta (M4)', async () => {
    const { users, useCase } = build({ ...profile, emailVerified: false });

    await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toBeInstanceOf(
      GoogleEmailNotVerifiedError,
    );
    expect(users.size).toBe(0);
  });

  it('email_verified=false NO vincula a una cuenta email+password preexistente (M4, pre-hijacking)', async () => {
    const { users, useCase } = build({ ...profile, emailVerified: false });
    const existing = new UserBuilder().withId('u9').withEmail('grace@example.com').build();
    await users.create(existing);

    await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toBeInstanceOf(
      GoogleEmailNotVerifiedError,
    );
    expect((await users.findById('u9'))?.googleSub).toBeNull();
  });
});
