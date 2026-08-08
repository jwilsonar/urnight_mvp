import { z } from 'zod';

/**
 * Códigos de rol RBAC del MVP (§4.1 RoleCode). lowercase canónico (varchar+CHECK).
 * `staff` es la barra del local: opera los pedidos in-venue y lee la carta.
 * Debe coincidir con el CHECK `role_code_check` de `packages/db`.
 */
export const ROLE_CODES = [
  'user',
  'admin_local',
  'promoter',
  'validator',
  'staff',
  'super_admin',
] as const;
export const roleCodeSchema = z.enum(ROLE_CODES);
export type RoleCode = z.infer<typeof roleCodeSchema>;

/** Otorgar un rol a un usuario con scope multi-tenant opcional (§5 RBAC). */
export const grantRoleSchema = z.object({
  roleCode: roleCodeSchema,
  companyId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
});
export type GrantRoleDto = z.infer<typeof grantRoleSchema>;

/** Rol como lo devuelve la API. */
export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  code: roleCodeSchema,
  name: z.string(),
  description: z.string().nullable(),
});
export type RoleResponse = z.infer<typeof roleResponseSchema>;

/** Asignación de rol (USER_ROLE) con su scope. */
export const roleAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  roleCode: roleCodeSchema,
  companyId: z.string().uuid().nullable(),
  localId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  grantedAt: z.string(),
});
export type RoleAssignmentResponse = z.infer<typeof roleAssignmentResponseSchema>;
