import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { RoleAssignmentNotFoundError } from '../../domain/errors/identity.errors';
import { RoleRevokedEvent } from '../../domain/events/identity.events';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';

/** Caso de uso: revocar una asignación de rol (soft: isActive=false). */
@Injectable()
export class RevokeRoleUseCase {
  private readonly log = createLogger(RevokeRoleUseCase.name);

  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: { assignmentId: string }): Promise<void> {
    this.log.debug({ assignmentId: input.assignmentId }, 'identity.role.revoke_started');
    const assignment = await this.assignments.findById(input.assignmentId);
    if (!assignment) {
      this.log.warn({ assignmentId: input.assignmentId }, 'identity.role.assignment_not_found');
      throw new RoleAssignmentNotFoundError();
    }

    assignment.revoke();
    await this.assignments.update(assignment);
    this.log.info({ userId: assignment.userId, assignmentId: assignment.id }, 'identity.role.revoked');

    await this.events.publish(
      new RoleRevokedEvent({ userId: assignment.userId, assignmentId: assignment.id }),
    );
  }
}
