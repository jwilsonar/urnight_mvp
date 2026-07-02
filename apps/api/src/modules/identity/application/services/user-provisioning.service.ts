import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { OutboxPort, type OutboxJob } from '../../../../shared/outbox/outbox.port';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type { User } from '../../domain/entities/user.entity';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { RoleNotFoundError } from '../../domain/errors/identity.errors';
import { UserRegisteredEvent } from '../../domain/events/identity.events';
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

/** Datos para aprovisionar una cuenta nueva (email o Google). */
export interface ProvisionUserInput {
  /** Aggregate ya construido (registerWithEmail / registerWithGoogle). */
  user: User;
  /** Preferencia de marketing inicial (email+password); Google no la aporta. */
  acceptsMarketing?: boolean;
  /** Job de email a encolar en la MISMA Tx (verificación / bienvenida). */
  emailJob: OutboxJob;
}

/**
 * Servicio de aplicación: aprovisiona un usuario nuevo de forma atómica (UoW):
 * rol `user` por defecto + preferencias + asignación de rol, y encola el email en
 * la MISMA Tx (outbox transaccional §3.2 → M8). Publica UserRegistered tras el
 * commit. Extrae la lógica antes duplicada entre register/google-login (M18);
 * sigue el patrón de TokenIssuer.
 */
@Injectable()
export class UserProvisioningService {
  private readonly log = createLogger(UserProvisioningService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
    private readonly outbox: OutboxPort,
  ) {}

  async provision(input: ProvisionUserInput): Promise<User> {
    const { user } = input;

    const defaultRole = await this.roles.findByCode('user');
    if (!defaultRole) throw new RoleNotFoundError();

    const preference = UserPreference.createDefault({
      id: randomUUID(),
      userId: user.id,
      acceptsMarketing: input.acceptsMarketing,
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
      // Outbox dentro de la Tx (§3.2, M8): el email no se pierde si el proceso
      // cae entre el commit del usuario y el enqueue.
      await this.outbox.enqueue(input.emailJob, tx);
    });

    await this.events.publish(
      new UserRegisteredEvent({
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider,
      }),
    );

    this.log.info({ userId: user.id, authProvider: user.authProvider }, 'identity.user.provisioned');
    return user;
  }
}
