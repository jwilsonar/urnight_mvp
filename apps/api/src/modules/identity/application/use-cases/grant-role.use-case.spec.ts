import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  RoleMother,
  UserBuilder,
  captureEvents,
} from '../../../../shared/testing';
import {
  RoleAlreadyGrantedError,
  RoleNotFoundError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import { GrantRoleUseCase } from './grant-role.use-case';

function build() {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository();
  const assignments = new InMemoryRoleAssignmentRepository();
  const events = new EventBus();
  const useCase = new GrantRoleUseCase(users, roles, assignments, events);
  return { users, roles, assignments, events, useCase };
}

describe('GrantRoleUseCase', () => {
  it('otorga un rol con scope multi-tenant y emite RoleGrantedEvent', async () => {
    const { users, roles, assignments, events, useCase } = build();
    await users.create(new UserBuilder().withId('target').build());
    roles.seed(RoleMother.adminLocal());
    const captured = captureEvents(events, 'identity.role_granted');

    const result = await useCase.execute({
      actorUserId: 'admin',
      targetUserId: 'target',
      roleCode: 'admin_local',
      companyId: 'c1',
      localId: 'l1',
    });

    expect(result.roleCode).toBe('admin_local');
    expect(result.assignment.companyId).toBe('c1');
    expect(result.assignment.localId).toBe('l1');
    expect(result.assignment.grantedBy).toBe('admin');
    expect(assignments.size).toBe(1);
    expect(captured.names()).toContain('identity.role_granted');
  });

  it('usuario destino inexistente → UserNotFoundError', async () => {
    const { roles, useCase } = build();
    roles.seed(RoleMother.adminLocal());
    await expect(
      useCase.execute({ actorUserId: 'a', targetUserId: 'ghost', roleCode: 'admin_local' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('rol inexistente → RoleNotFoundError', async () => {
    const { users, useCase } = build();
    await users.create(new UserBuilder().withId('target').build());
    await expect(
      useCase.execute({ actorUserId: 'a', targetUserId: 'target', roleCode: 'admin_local' }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('rol ya otorgado en el mismo scope → RoleAlreadyGrantedError', async () => {
    const { users, roles, useCase } = build();
    await users.create(new UserBuilder().withId('target').build());
    roles.seed(RoleMother.adminLocal());
    const input = {
      actorUserId: 'a',
      targetUserId: 'target',
      roleCode: 'admin_local' as const,
      companyId: 'c1',
      localId: null,
    };
    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(RoleAlreadyGrantedError);
  });
});
