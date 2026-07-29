'use client';

import { useTranslations } from 'next-intl';
import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PromoterMetricsOverview } from './promoter-metrics-overview';

export function PromoterOverview() {
  const t = useTranslations('promoterMetrics.header');

  return (
    <div className="space-y-6">
      <PanelPageHeader
        title={t('title')}
        description={t('description')}
      />
      <PromoterMetricsOverview />
    </div>
  );
}
