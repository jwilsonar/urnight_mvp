import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth-helpers';

/**
 * Panel del promotor. Gate server-side: requiere rol `promoter` o `super_admin`.
 * El chrome lo aporta PanelShell.
 */
export default async function PromoterPanelLayout({ children }: { children: ReactNode }) {
  await requireRole(['promoter', 'super_admin'], '/panel');
  return children;
}
