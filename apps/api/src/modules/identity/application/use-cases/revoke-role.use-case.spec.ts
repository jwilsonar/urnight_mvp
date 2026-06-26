import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  InMemoryRoleAssignmentRepository,
  RoleAssignmentBuilder,
  captureEvents,
} from '../../../../shared/testing';
import { RoleAssignmentNotFoundError } from '../../domain/errors/identity.errors';
import { RevokeRoleUseCase } from './revoke-role.use-case';

function build() {
  const assignments = new InMemoryRoleAssignmentRepository();
  const events = new EventBus();
  const useCase = new RevokeRoleUseCase(assignments, events);
  return { assignments, events, useCase };
}

describe('RevokeRoleUseCase', () => {
  it('revoca (soft-delete) y emite RoleRevokedEvent con el userId', async () => {
    const { assignments, events, useCase } = build();
    await assignments.create(new RoleAssignmentBuilder().withId('a1').withUserId('u1').build());
    const captured = captureEvents(events, 'identity.role_revoked');

    await useCase.execute({ assignmentId: 'a1' });

    expect((await assignments.findById('a1'))?.isActive).toBe(false);
    expect(captured.names()).toContain('identity.role_revoked');
    const payload = captured.last()?.payload as { userId: string; assignmentId: string };
    expect(payload.userId).toBe('u1');
    expect(payload.assignmentId).toBe('a1');
  });

  it('asignación inexistente → RoleAssignmentNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ assignmentId: 'ghost' })).rejects.toBeInstanceOf(
      RoleAssignmentNotFoundError,
    );
  });
});
