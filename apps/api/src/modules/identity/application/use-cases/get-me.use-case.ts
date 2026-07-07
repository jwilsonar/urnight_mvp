import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { RoleCode } from '../../domain/entities/role.entity';
import type { User } from '../../domain/entities/user.entity';
import type { UserPreference } from '../../domain/entities/user-preference.entity';
import { UserNotFoundError } from '../../domain/errors/identity.errors';
import {
  USER_PREFERENCE_REPOSITORY,
  type UserPreferenceRepository,
} from '../../domain/ports/user-preference.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { RoleResolver } from '../services/role-resolver.service';

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
    private readonly roleResolver: RoleResolver,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
  ) {}

  async execute(input: { userId: string }): Promise<GetMeResult> {
    this.log.debug({ userId: input.userId }, 'identity.user.get_me');
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    const { roleCodes } = await this.roleResolver.resolveActive(user.id);
    const preference = await this.preferences.findByUser(user.id);
    return { user, roleCodes, preference };
  }
}
