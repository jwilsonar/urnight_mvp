import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth-helpers';

/**
 * Panel de administración local. Gate server-side adicional al de `(panels)`:
 * solo admin_local y super_admin. El chrome lo aporta PanelShell.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(['admin_local', 'super_admin'], '/panel');
  return children;
}
