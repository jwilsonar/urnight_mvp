import type { Role, RoleCode } from '../entities/role.entity';

/** Puerto de lectura del catálogo de roles RBAC. */
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(code: RoleCode): Promise<Role | null>;
  listAll(): Promise<Role[]>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
