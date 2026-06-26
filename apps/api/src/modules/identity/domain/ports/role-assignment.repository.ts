import type { RoleAssignment } from '../entities/role-assignment.entity';

/** Scope multi-tenant de una asignación (null = global / company-wide). */
export interface AssignmentScope {
  companyId: string | null;
  localId: string | null;
}

/** Puerto del repositorio de asignaciones de rol (USER_ROLE). */
export interface RoleAssignmentRepository {
  /** Asignaciones ACTIVAS de un usuario (para resolver roles + scope en el token). */
  findActiveByUser(userId: string): Promise<RoleAssignment[]>;
  findById(id: string): Promise<RoleAssignment | null>;
  exists(userId: string, roleId: string, scope: AssignmentScope): Promise<boolean>;
  create(assignment: RoleAssignment, tx?: unknown): Promise<RoleAssignment>;
  /** Persiste el cambio de estado (revoke → isActive=false). */
  update(assignment: RoleAssignment): Promise<RoleAssignment>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
