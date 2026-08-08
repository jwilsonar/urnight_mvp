import { SetMetadata } from '@nestjs/common';

/** Roles RBAC del MVP (§5). Espejo de `ROLE_CODES` en `@urnight/contracts`. */
export type Role =
  | 'user'
  | 'admin_local'
  | 'promoter'
  | 'validator'
  | 'staff'
  | 'super_admin';

export const ROLES_KEY = 'roles';

/** Restringe un handler a uno o más roles (scope multi-tenant lo evalúa el guard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
