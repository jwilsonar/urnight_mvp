'use client';

import { Check, FileText, X } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from '@urnight/ui';
import {
  listPendingLocalVerificationDocuments,
  reviewLocalVerificationDocument,
} from '@/lib/api/ops';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

export function VerificationDocumentReviewQueue() {
  const t = useTranslations('verificationDocuments.review');
  const typesT = useTranslations('verificationDocuments.types');
  const format = useFormatter();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const queryKey = queryKeys.pendingLocalVerificationDocuments;
  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listPendingLocalVerificationDocuments(token),
    enabled: Boolean(token),
  });
  const mutation = useApiMutation({
    mutationFn: (input: {
      id: string;
      decision: 'approved' | 'rejected';
      notes?: string;
    }) =>
      reviewLocalVerificationDocument(
        input.id,
        { decision: input.decision, notes: input.notes },
        token,
      ),
    invalidateKeys: [queryKey],
    successMessage: t('saved'),
  });

  function reject(id: string) {
    const notes = reasons[id]?.trim();
    if (!notes) {
      toast.error(t('reasonRequired'));
      return;
    }
    mutation.mutate({ id, decision: 'rejected', notes });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto size-9 text-muted-foreground" />
        <p className="mt-2 font-medium">{t('emptyTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id}>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-semibold">{document.localName}</p>
                <p className="text-sm text-muted-foreground">
                  {typesT(document.documentType)} ·{' '}
                  {t('expires', {
                    date: format.dateTime(
                      new Date(`${document.expiresAt}T00:00:00`),
                      { dateStyle: 'medium' },
                    ),
                  })}
                </p>
              </div>
              <Badge variant="secondary">{t('pending')}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {document.downloadUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={document.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('open')}
                  </a>
                </Button>
              ) : null}
              <Button
                size="sm"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({ id: document.id, decision: 'approved' })
                }
              >
                <Check className="size-4" />
                {t('approve')}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reason-${document.id}`}>{t('reason')}</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`reason-${document.id}`}
                  value={reasons[document.id] ?? ''}
                  placeholder={t('reasonPlaceholder')}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [document.id]: event.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  disabled={mutation.isPending}
                  onClick={() => reject(document.id)}
                >
                  <X className="size-4" />
                  {t('reject')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
