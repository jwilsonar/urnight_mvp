import type { Metadata } from 'next';
import { PromoterOverview } from '@/components/promoter/promoter-overview';
import { requireRole } from '@/lib/auth-helpers';

export const metadata: Metadata = {
  title: 'Panel de promotor',
  description: 'Gestiona tu enlace de referido, códigos promocionales y comisiones.',
};

/**
 * Dashboard del promotor. El gate de rol vive en el layout; lo reforzamos aquí
 * para garantizar sesión + rol antes de renderizar. El backend no expone
 * `GET /promoters/me`, por lo que la gestión del promotor activo es client-side.
 */
export default async function PromoterPage() {
  await requireRole(['promoter', 'super_admin'], '/panel');

  return <PromoterOverview />;
}
