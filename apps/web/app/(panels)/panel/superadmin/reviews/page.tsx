import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VerificationDocumentReviewQueue } from '@/components/superadmin/verification-document-review-queue';

export const metadata: Metadata = { title: 'Revisiones' };

export default async function SuperAdminReviewsPage() {
  const t = await getTranslations('verificationDocuments.review');
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </header>
      <VerificationDocumentReviewQueue />
    </div>
  );
}
