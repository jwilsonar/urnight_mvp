import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PromoterRanking } from '@/components/promoter/promoter-ranking';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('promoterMetrics.superadmin');
  return { title: t('metadataTitle') };
}

export default async function SuperAdminPromoterMetricsPage() {
  const t = await getTranslations('promoterMetrics.superadmin');

  return (
    <div className="space-y-6">
      <PanelPageHeader
        title={t('title')}
        description={t('description')}
      />
      <PromoterRanking />
    </div>
  );
}
