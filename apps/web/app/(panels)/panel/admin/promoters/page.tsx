import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminPromotersManager } from '@/components/admin/admin-promoters-manager';
import { PromoterRanking } from '@/components/promoter/promoter-ranking';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('promoterMetrics.admin');
  return { title: t('metadataTitle') };
}

export default async function AdminPromotersPage() {
  const t = await getTranslations('promoterMetrics.admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <AdminPromotersManager />
      <PromoterRanking />
    </div>
  );
}
