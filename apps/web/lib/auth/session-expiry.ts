'use client';

import { signOut } from 'next-auth/react';
import { ApiError } from '@/lib/api/client';
import { isSafeInternalPath } from '@/lib/utils/paths';

/**
 * Manejo centralizado de sesión expirada en cliente. Dos señales convergen aquí:
 * - Un 401 del API en cualquier query/mutación (interceptor de QueryCache/
 *   MutationCache en providers.tsx): el token fue revocado o venció sin refresh.
 * - `session.error === 'RefreshAccessTokenError'` (SessionExpiryWatcher): el
 *   refresh falló y la sesión ya no entrega accessToken, así que las queries
 *   gateadas por `enabled` se apagan sin llegar a emitir un 401.
 *
 * En ambos casos: signOut + redirección a login con callbackUrl, UNA sola vez
 * (flag de módulo) y nunca desde las propias páginas de auth (anti-loop).
 */

let handling = false;

/** ¿Es un error de API que implica sesión inutilizable? */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export function handleSessionExpired(): void {
  if (handling || typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return;
  handling = true;

  const current = `${pathname}${search}`;
  const callbackUrl = isSafeInternalPath(current) ? current : '/';
  const target = `/login?error=SessionExpired&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  // `redirect: false` + navegación manual: el signOut de la beta de NextAuth v5
  // cambió la forma del parámetro de destino; así no dependemos de esa API.
  void signOut({ redirect: false }).finally(() => {
    window.location.assign(target);
  });
}
