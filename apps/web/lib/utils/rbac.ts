import type { RoleCode } from '@urnight/contracts';

/**
 * Roles con panel web propio. `validator` tiene una landing web informativa
 * (la validación real ocurre en la app nativa de puerta, §5).
 */
export const PANEL_ROLES = [
  'admin_local',
  'promoter',
  'validator',
  'super_admin',
] as const satisfies readonly RoleCode[];

/**
 * Prioridad de roles (mayor privilegio primero). Resuelve el destino y la
 * etiqueta cuando un usuario tiene varios roles a la vez.
 */
const ROLE_PRIORITY = [
  'super_admin',
  'admin_local',
  'promoter',
  'validator',
  'user',
] as const satisfies readonly RoleCode[];

/** Ruta "home" de cada rol. `user` aterriza en el home consumidor. */
export const ROLE_HOME = {
  super_admin: '/panel/superadmin',
  admin_local: '/panel/admin',
  promoter: '/panel/promoter',
  validator: '/panel/validator',
  user: '/',
} as const satisfies Record<RoleCode, string>;

/** Etiqueta corta del panel por rol (para menús). */
export const ROLE_PANEL_LABEL = {
  super_admin: 'Panel de plataforma',
  admin_local: 'Panel de local',
  promoter: 'Panel de promotor',
  validator: 'Panel de validador',
  user: 'Mi cuenta',
} as const satisfies Record<RoleCode, string>;

/** ¿El usuario tiene exactamente este rol? */
export function hasRole(roles: readonly string[] | undefined, role: RoleCode): boolean {
  return roles?.includes(role) ?? false;
}

/** ¿El usuario tiene alguno de estos roles? */
export function hasAnyRole(roles: readonly string[] | undefined, allowed: readonly RoleCode[]): boolean {
  if (!roles) return false;
  const set = new Set<string>(allowed);
  return roles.some((role) => set.has(role));
}

/** ¿Puede acceder a algún panel privado? */
export function canAccessPanels(roles: readonly string[] | undefined): boolean {
  return hasAnyRole(roles, PANEL_ROLES);
}

/** Rol principal (de mayor privilegio) del usuario; `user` por defecto. */
export function primaryRole(roles: readonly string[] | undefined): RoleCode {
  if (!roles?.length) return 'user';
  const set = new Set(roles);
  return ROLE_PRIORITY.find((role) => set.has(role)) ?? 'user';
}

/** Ruta de aterrizaje tras el login según el rol de mayor privilegio. */
export function roleHomePath(roles: readonly string[] | undefined): string {
  return ROLE_HOME[primaryRole(roles)];
}
