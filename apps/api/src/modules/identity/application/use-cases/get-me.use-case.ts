import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { RoleCode } from '../../domain/entities/role.entity';
import type { User } from '../../domain/entities/user.entity';
import type { UserPreference } from '../../domain/entities/user-preference.entity';
import { UserNotFoundError } from '../../domain/errors/identity.errors';
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

export interface GetMeResult {
  user: User;
  roleCodes: RoleCode[];
  preference: UserPreference | null;
}

/** Caso de uso (lectura): perfil del usuario autenticado + roles + preferencias. */
@Injectable()
export class GetMeUseCase {
  private readonly log = createLogger(GetMeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
  ) {}

  async execute(input: { userId: string }): Promise<GetMeResult> {
    this.log.debug({ userId: input.userId }, 'identity.user.get_me');
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    const active = await this.assignments.findActiveByUser(user.id);
    const codeById = new Map((await this.roles.listAll()).map((r) => [r.id, r.code]));
    const roleCodes = active
      .map((a) => codeById.get(a.roleId))
      .filter((c): c is RoleCode => c !== undefined);

    const preference = await this.preferences.findByUser(user.id);
    return { user, roleCodes, preference };
  }
}
