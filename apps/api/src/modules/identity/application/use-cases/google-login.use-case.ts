import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GoogleLoginDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { OutboxPort } from '../../../../shared/outbox/outbox.port';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import { User } from '../../domain/entities/user.entity';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { AccountDisabledError, RoleNotFoundError } from '../../domain/errors/identity.errors';
import { UserRegisteredEvent } from '../../domain/events/identity.events';
import { GoogleVerifier } from '../../domain/ports/google-verifier.port';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/ports/role.repository';
import {
  USER_PREFERENCE_REPOSITORY,
  type UserPreferenceRepository,
} from '../../domain/ports/user-preference.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

/**
 * Caso de uso: login federado con Google (OIDC). Verifica el ID token (ACL),
 * resuelve la cuenta (por google_sub → por email → alta nueva) y emite tokens.
 */
@Injectable()
export class GoogleLoginUseCase {
  private readonly log = createLogger(GoogleLoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    private readonly google: GoogleVerifier,
    private readonly issuer: TokenIssuer,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(dto: GoogleLoginDto): Promise<AuthResult> {
    this.log.debug({}, 'identity.login.started');
    const profile = await this.google.verify(dto.idToken);

    let user = await this.users.findByGoogleSub(profile.sub);
    if (!user) {
      const existing = await this.users.findByEmail(profile.email);
      user = existing ? await this.linkExisting(existing, profile.sub) : await this.createNew(profile);
    }
    if (!user.isActive) {
      this.log.warn({ userId: user.id }, 'identity.login.account_disabled');
      throw new AccountDisabledError();
    }

    user.recordLogin();
    await this.users.update(user);

    this.log.info({ userId: user.id, provider: 'google' }, 'identity.login.success');
    return this.issuer.issueFor(user);
  }

  private async linkExisting(user: User, googleSub: string): Promise<User> {
    user.linkGoogle(googleSub);
    return this.users.update(user);
  }

  private async createNew(profile: {
    sub: string;
    email: string;
    name: string;
    picture: string | null;
  }): Promise<User> {
    const defaultRole = await this.roles.findByCode('user');
    if (!defaultRole) throw new RoleNotFoundError();

    const user = User.registerWithGoogle({
      id: randomUUID(),
      fullName: profile.name,
      email: profile.email,
      googleSub: profile.sub,
      avatarUrl: profile.picture,
    });
    const preference = UserPreference.createDefault({ id: randomUUID(), userId: user.id });
    const assignment = RoleAssignment.grant({
      id: randomUUID(),
      userId: user.id,
      roleId: defaultRole.id,
    });

    await this.uow.run(async (tx) => {
      await this.users.create(user, tx);
      await this.preferences.create(preference, tx);
      await this.assignments.create(assignment, tx);
    });

    await this.events.publish(
      new UserRegisteredEvent({ userId: user.id, email: user.email, authProvider: 'google' }),
    );
    await this.outbox.enqueue({
      queue: 'notifications',
      name: 'send-welcome-email',
      data: { userId: user.id, email: user.email },
    });

    return user;
  }
}
