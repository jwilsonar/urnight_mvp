import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PromoterOverview } from '@/components/promoter/promoter-overview';
import { requireRole } from '@/lib/auth-helpers';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('promoterMetrics.header');
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

/**
 * Dashboard del promotor. El gate de rol vive en el layout; lo reforzamos aquí
 * para garantizar sesión + rol antes de renderizar. El backend no expone
 * `GET /promoters/me`, por lo que la gestión del promotor activo es client-side.
 */
export default async function PromoterPage() {
  await requireRole(['promoter', 'super_admin'], '/panel');

  return <PromoterOverview />;
}
