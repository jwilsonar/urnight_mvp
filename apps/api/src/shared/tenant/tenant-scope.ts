import { TenantForbiddenError } from '../errors/tenant-forbidden.error';

/**
 * Ámbito multi-tenant del actor (§4.1 RBAC con scope por empresa). Tipo PURO,
 * sin dependencias de framework: lo consumen los casos de uso (application) y
 * lo construye la capa edge desde el JWT. Aísla las lecturas/escrituras por
 * empresa — una empresa NUNCA ve recursos de otra (invariante de aislamiento).
 */
export interface TenantScope {
  /** super_admin: ve todas las empresas (sin filtro). */
  readonly isSuperAdmin: boolean;
  /** Empresa del actor (null si el token no tiene scope de empresa). */
  readonly companyId: string | null;
}

/**
 * `company_id` efectivo para filtrar en el repositorio:
 * - super_admin  → `null` (sin filtro, todas las empresas)
 * - admin/scoped → su `companyId`
 * - sin empresa  → `undefined` (no puede ver NADA tenant-scoped)
 *
 * Convención del repo: `null` = todas; `string` = esa empresa.
 * `undefined` lo cortocircuita el caso de uso devolviendo vacío.
 */
export function scopedCompanyId(scope: TenantScope): string | null | undefined {
  if (scope.isSuperAdmin) return null;
  return scope.companyId ?? undefined;
}

/**
 * Asegura que el actor puede operar sobre un recurso de la empresa
 * `resourceCompanyId`. super_admin pasa siempre; el resto debe coincidir.
 * Punto ÚNICO de la regla de aislamiento (DRY) — usado por todos los módulos.
 */
export function assertTenant(scope: TenantScope, resourceCompanyId: string | null): void {
  if (scope.isSuperAdmin) return;
  if (resourceCompanyId === null || scope.companyId !== resourceCompanyId) {
    throw new TenantForbiddenError();
  }
}
