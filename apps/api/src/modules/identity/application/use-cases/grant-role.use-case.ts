import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RoleCode } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import {
  RoleAlreadyGrantedError,
  RoleNotFoundError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import { RoleGrantedEvent } from '../../domain/events/identity.events';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/ports/role.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

export interface GrantRoleInput {
  actorUserId: string;
  targetUserId: string;
  roleCode: RoleCode;
  companyId?: string | null;
  localId?: string | null;
}

export interface GrantRoleResult {
  assignment: RoleAssignment;
  roleCode: RoleCode;
}

/** Caso de uso: otorgar un rol con scope multi-tenant (RBAC §5). */
@Injectable()
export class GrantRoleUseCase {
  private readonly log = createLogger(GrantRoleUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: GrantRoleInput): Promise<GrantRoleResult> {
    this.log.debug(
      { userId: input.actorUserId, targetUserId: input.targetUserId, role: input.roleCode },
      'identity.role.grant_started',
    );
    const target = await this.users.findById(input.targetUserId);
    if (!target) {
      this.log.warn({ userId: input.actorUserId, targetUserId: input.targetUserId }, 'identity.role.user_not_found');
      throw new UserNotFoundError();
    }

    const role = await this.roles.findByCode(input.roleCode);
    if (!role) {
      this.log.warn({ userId: input.actorUserId, role: input.roleCode }, 'identity.role.not_found');
      throw new RoleNotFoundError();
    }

    const scope = { companyId: input.companyId ?? null, localId: input.localId ?? null };
    if (await this.assignments.exists(target.id, role.id, scope)) {
      this.log.warn(
        { userId: input.actorUserId, targetUserId: target.id, role: input.roleCode },
        'identity.role.already_granted',
      );
      throw new RoleAlreadyGrantedError();
    }

    const assignment = RoleAssignment.grant({
      id: randomUUID(),
      userId: target.id,
      roleId: role.id,
      companyId: scope.companyId,
      localId: scope.localId,
      grantedBy: input.actorUserId,
    });
    await this.assignments.create(assignment);
    this.log.info(
      {
        userId: target.id,
        role: role.code,
        companyId: scope.companyId ?? undefined,
        localId: scope.localId ?? undefined,
      },
      'identity.role.granted',
    );

    await this.events.publish(
      new RoleGrantedEvent({
        userId: target.id,
        roleCode: role.code,
        companyId: scope.companyId,
        localId: scope.localId,
      }),
    );

    return { assignment, roleCode: role.code };
  }
}
