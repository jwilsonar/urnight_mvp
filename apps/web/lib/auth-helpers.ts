import { redirect } from 'next/navigation';
import type { RoleCode } from '@urnight/contracts';
import { auth } from './auth';
import { hasAnyRole } from './utils/rbac';

/** Sesión actual (o null) en Server Components / Route Handlers. */
export function getSession() {
  return auth();
}

/** Exige sesión; si no hay, redirige a login con callbackUrl. */
export async function requireSession(callbackUrl = '/') {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}

/** Exige sesión + alguno de los roles; si falta, redirige. */
export async function requireRole(roles: readonly RoleCode[], callbackUrl = '/') {
  const session = await requireSession(callbackUrl);
  if (!hasAnyRole(session.user.roles, roles)) {
    redirect('/');
  }
  return session;
}

/**
 * Exige sesión CON access token vigente. El gate de rol/sesión no garantiza un
 * token utilizable: si el refresh falló (`session.error`) o el token no llegó,
 * re-autenticamos en vez de mandar un `Bearer` vacío que el backend rechazaría
 * con 401. Devuelve la sesión y el token (string no vacío garantizado).
 */
export async function requireAccessToken(callbackUrl = '/') {
  const session = await requireSession(callbackUrl);
  if (!session.accessToken || session.error) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return { session, token: session.accessToken };
}
