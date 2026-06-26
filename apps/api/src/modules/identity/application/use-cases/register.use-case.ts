import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegisterDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { OutboxPort } from '../../../../shared/outbox/outbox.port';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import { User } from '../../domain/entities/user.entity';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import {
  DocumentAlreadyRegisteredError,
  EmailAlreadyRegisteredError,
  RoleNotFoundError,
} from '../../domain/errors/identity.errors';
import { UserRegisteredEvent } from '../../domain/events/identity.events';
import { PersonalId } from '../../domain/value-objects/personal-id.value-object';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/ports/role.repository';
import { TokenService } from '../../domain/ports/token.port';
import {
  USER_PREFERENCE_REPOSITORY,
  type UserPreferenceRepository,
} from '../../domain/ports/user-preference.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

/**
 * Caso de uso: registro con email + contraseña. Atómico (UoW): crea usuario +
 * preferencias + rol por defecto en una Tx. Invariantes: email/documento únicos,
 * 18+ (vía PersonalId). Emite UserRegistered y encola el email de verificación.
 */
@Injectable()
export class RegisterUseCase {
  private readonly log = createLogger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly issuer: TokenIssuer,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResult> {
    this.log.debug({ documentType: dto.documentType }, 'identity.register.started');
    if (await this.users.existsByEmail(dto.email)) {
      this.log.warn({}, 'identity.register.email_taken');
      throw new EmailAlreadyRegisteredError();
    }
    if (await this.users.findByDocumentNumber(dto.documentNumber)) {
      throw new DocumentAlreadyRegisteredError();
    }

    const defaultRole = await this.roles.findByCode('user');
    if (!defaultRole) throw new RoleNotFoundError();

    const identity = PersonalId.create({
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      birthDate: new Date(dto.birthDate),
    });
    const passwordHash = await this.hasher.hash(dto.password);

    const user = User.registerWithEmail({
      id: randomUUID(),
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      identity,
      phone: dto.phone ?? null,
    });
    const preference = UserPreference.createDefault({
      id: randomUUID(),
      userId: user.id,
      acceptsMarketing: dto.acceptsMarketing,
    });
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
      new UserRegisteredEvent({
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider,
      }),
    );
    const verificationToken = await this.tokens.signEmailVerification(user.id);
    await this.outbox.enqueue({
      queue: 'notifications',
      name: 'send-verification-email',
      data: { userId: user.id, email: user.email, token: verificationToken },
    });

    this.log.info({ userId: user.id }, 'identity.register.created');
    return this.issuer.issueFor(user);
  }
}
