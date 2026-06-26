import { describe, expect, it } from 'vitest';
import {
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserPreferenceRepository,
  InMemoryUserRepository,
  RoleAssignmentBuilder,
  RoleMother,
  UserBuilder,
  UserPreferenceBuilder,
} from '../../../../shared/testing';
import { UserNotFoundError } from '../../domain/errors/identity.errors';
import { GetMeUseCase } from './get-me.use-case';

function build() {
  const users = new InMemoryUserRepository();
  const assignments = new InMemoryRoleAssignmentRepository();
  const roles = new InMemoryRoleRepository();
  const preferences = new InMemoryUserPreferenceRepository();
  const useCase = new GetMeUseCase(users, assignments, roles, preferences);
  return { users, assignments, roles, preferences, useCase };
}

describe('GetMeUseCase', () => {
  it('devuelve perfil + roles activos + preferencias', async () => {
    const { users, assignments, roles, preferences, useCase } = build();
    await users.create(new UserBuilder().withId('u1').build());
    const role = RoleMother.adminLocal();
    roles.seed(role);
    await assignments.create(
      new RoleAssignmentBuilder().withUserId('u1').withRoleId(role.id).build(),
    );
    await preferences.create(new UserPreferenceBuilder().withUserId('u1').build());

    const result = await useCase.execute({ userId: 'u1' });

    expect(result.user.id).toBe('u1');
    expect(result.roleCodes).toContain('admin_local');
    expect(result.preference).not.toBeNull();
  });

  it('ignora asignaciones cuyo rol no existe en el catálogo (filtra undefined) y preferencia null', async () => {
    const { users, assignments, useCase } = build();
    await users.create(new UserBuilder().withId('u2').build());
    await assignments.create(
      new RoleAssignmentBuilder().withUserId('u2').withRoleId('rol-fantasma').build(),
    );

    const result = await useCase.execute({ userId: 'u2' });

    expect(result.roleCodes).toHaveLength(0);
    expect(result.preference).toBeNull();
  });

  it('usuario inexistente → UserNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ userId: 'ghost' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
