"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import type { RoleCode } from "@urnight/contracts";
import { hasAnyRole } from "@/lib/utils/rbac";

interface RoleGuardProps {
  roles: readonly RoleCode[];
  children: ReactNode;
  /** Qué mostrar si no cumple (por defecto, nada). */
  fallback?: ReactNode;
}

/**
 * Muestra `children` solo si la sesión tiene alguno de los roles. Es UI-only:
 * el backend siempre revalida permisos en cada request.
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  // Mientras la sesión carga aún no conocemos los roles: mostramos el fallback
  // en vez de evaluar contra `undefined` y parpadear contenido privilegiado.
  if (status === "loading") return <>{fallback}</>;
  return hasAnyRole(session?.user?.roles, roles) ? (
    <>{children}</>
  ) : (
    <>{fallback}</>
  );
}
