'use client';

import { FileArrowUp, FilePdf, WarningCircle } from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type LocalDocumentType,
  type LocalVerificationDocumentResponse,
} from '@urnight/contracts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import {
  confirmLocalVerificationDocument,
  listLocalVerificationDocuments,
} from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { uploadToStaging } from '@/lib/api/uploads';

const DOCUMENT_TYPES: LocalDocumentType[] = [
  'municipal_license',
  'itse_certificate',
  'health_certificate',
  'other',
];

const STATUS_VARIANTS: Record<
  LocalVerificationDocumentResponse['lifecycleStatus'],
  'success' | 'secondary' | 'destructive' | 'warning'
> = {
  valid: 'success',
  expiring_soon: 'warning',
  expired: 'destructive',
  pending: 'secondary',
  rejected: 'destructive',
};

export function LocalVerificationDocumentsManager({
  localId,
}: {
  localId: string;
}) {
  const t = useTranslations('verificationDocuments');
  const format = useFormatter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const queryClient = useQueryClient();
  const queryKey = queryKeys.localVerificationDocuments(localId);
  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listLocalVerificationDocuments(localId, token),
    enabled: Boolean(token),
  });
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<LocalDocumentType>('municipal_license');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !issuedAt || !expiresAt || !token) {
      toast.error(t('form.required'));
      return;
    }
    if (
      !(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type) ||
      file.size > MAX_DOCUMENT_BYTES
    ) {
      toast.error(t('form.invalidFile'));
      return;
    }
    setUploading(true);
    try {
      const key = await uploadToStaging(
        file,
        'verificationDocument',
        token,
      );
      await confirmLocalVerificationDocument(
        localId,
        { key, documentType, issuedAt, expiresAt },
        token,
      );
      await queryClient.invalidateQueries({ queryKey });
      setFile(null);
      setIssuedAt('');
      setExpiresAt('');
      const input = document.getElementById(
        `verification-file-${localId}`,
      ) as HTMLInputElement | null;
      if (input) input.value = '';
      toast.success(t('form.uploaded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('form.failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`verification-file-${localId}`}>{t('form.file')}</Label>
          <Input
            id={`verification-file-${localId}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">{t('form.fileHint')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('form.type')}</Label>
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value as LocalDocumentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`issued-at-${localId}`}>{t('form.issuedAt')}</Label>
            <Input
              id={`issued-at-${localId}`}
              type="date"
              value={issuedAt}
              onChange={(event) => setIssuedAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`expires-at-${localId}`}>{t('form.expiresAt')}</Label>
            <Input
              id={`expires-at-${localId}`}
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={uploading}>
            <FileArrowUp className="size-4" />
            {uploading ? t('form.uploading') : t('form.submit')}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <FilePdf className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-medium">{t('empty.title')}</p>
          <p className="text-sm text-muted-foreground">{t('empty.description')}</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {t(`types.${document.documentType}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('expires', {
                        date: format.dateTime(
                          new Date(`${document.expiresAt}T00:00:00`),
                          { dateStyle: 'medium' },
                        ),
                      })}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[document.lifecycleStatus]}>
                    {t(`status.${document.lifecycleStatus}`)}
                  </Badge>
                </div>
                {document.reviewNotes ? (
                  <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm">
                    <WarningCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span>{document.reviewNotes}</span>
                  </div>
                ) : null}
                {document.downloadUrl ? (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={document.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('viewDocument')}
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
