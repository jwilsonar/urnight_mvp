import type { Metadata } from 'next';
import { ManageRedemptionCodes } from '@/components/promoter/manage-event-codes';
import { requireRole } from '@/lib/auth-helpers';

export const metadata: Metadata = {
  title: 'Gestionar códigos del evento',
  description: 'Genera y comparte códigos de entrada gratis para el evento asignado.',
};

/**
 * Gestión de códigos de un evento asignado al promotor. El gate de rol vive en el
 * layout; lo reforzamos aquí. La data (asignación + códigos) se carga client-side.
 */
export default async function PromoterEventPage({
  params,
}: {
  params: Promise<{ promoterEventId: string }>;
}) {
  await requireRole(['promoter', 'super_admin'], '/panel');
  const { promoterEventId } = await params;

  return <ManageRedemptionCodes promoterEventId={promoterEventId} />;
}
