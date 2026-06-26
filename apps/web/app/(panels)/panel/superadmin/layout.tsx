import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth-helpers';

/**
 * Panel de operaciones de plataforma. Gate server-side: requiere rol
 * `super_admin`. El chrome (navbar + sidebar) lo aporta PanelShell.
 */
export default async function SuperAdminPanelLayout({ children }: { children: ReactNode }) {
  await requireRole(['super_admin'], '/panel');
  return children;
}
