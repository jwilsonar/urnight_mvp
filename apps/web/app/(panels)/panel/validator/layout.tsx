import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth-helpers';

/**
 * Panel del validador de puerta. Gate server-side: solo `validator` y
 * `super_admin`. El chrome lo aporta PanelShell. El escaneo real ocurre en la
 * app nativa de validación (§5).
 */
export default async function ValidatorPanelLayout({ children }: { children: ReactNode }) {
  await requireRole(['validator', 'super_admin'], '/panel');
  return children;
}
