import { Inject, Injectable } from '@nestjs/common';
import type { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type { RoleCode } from '../../domain/entities/role.entity';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/ports/role.repository';

/** Asignaciones activas del usuario + sus códigos de rol resueltos. */
export interface ResolvedRoles {
  assignments: RoleAssignment[];
  roleCodes: RoleCode[];
}

/**
 * Servicio de aplicación: resuelve las asignaciones activas de un usuario y las
 * traduce roleId → RoleCode contra el catálogo. Fuente única de esa resolución,
 * antes duplicada entre TokenIssuer y GetMeUseCase (DRY #9).
 */
@Injectable()
export class RoleResolver {
  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async resolveActive(userId: string): Promise<ResolvedRoles> {
    const active = await this.assignments.findActiveByUser(userId);
    const codeById = new Map((await this.roles.listAll()).map((r) => [r.id, r.code]));
    const roleCodes = active
      .map((a) => codeById.get(a.roleId))
      .filter((c): c is RoleCode => c !== undefined);
    return { assignments: active, roleCodes };
  }
}
