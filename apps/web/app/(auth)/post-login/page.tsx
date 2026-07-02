import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-helpers';
import { isSafeInternalPath } from '@/lib/utils/paths';
import { roleHomePath } from '@/lib/utils/rbac';

export const metadata: Metadata = { title: 'Redirigiendo…' };

/**
 * Resolutor de aterrizaje tras el login (server-side). Cuando se llega aquí la
 * cookie de sesión ya está fijada, por lo que `getSession()` ve los roles
 * autoritativos del backend y redirige a cada rol a su panel:
 *   super_admin → /panel/superadmin · admin_local → /panel/admin
 *   promoter → /panel/promoter · validator → /panel/validator · user → /
 * Un `callbackUrl` interno explícito (deep-link) tiene prioridad.
 */
export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect(isSafeInternalPath(callbackUrl) ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
  }

  if (isSafeInternalPath(callbackUrl) && callbackUrl !== '/') {
    redirect(callbackUrl);
  }

  redirect(roleHomePath(session.user.roles));
}
