'use client';

import { CheckCircle, Copy, LinkSimple } from '@phosphor-icons/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { ReferralLinkResponse } from '@urnight/contracts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@urnight/ui';

const STORAGE_KEY = 'ravenue.promoter.link-aliases.v1';
const KNOWN_ALIASES = new Set([
  'ravenue',
  'nocturna-club',
  'sky-lounge-360',
  'barranco-beats',
  'karaoke-estelar',
  'piero',
]);

type AliasStatus = 'pending' | 'approved' | 'used';

interface AliasRequest {
  promoterId: string;
  slug: string;
  status: AliasStatus;
  requestedAt: string;
}

function readRequests(): AliasRequest[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AliasRequest[]) : [];
  } catch {
    return [];
  }
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function withSlug(url: string, slug: string): string {
  const clean = url.replace(/\/+$/, '');
  const separator = clean.lastIndexOf('/');
  return separator >= 0 ? `${clean.slice(0, separator + 1)}${slug}` : `${clean}/${slug}`;
}

export function PersonalizableReferralLinkCard({
  promoterId,
  promoterName,
  link,
  allowPersonalization = false,
}: {
  promoterId: string;
  promoterName: string;
  link: ReferralLinkResponse;
  allowPersonalization?: boolean;
}) {
  const defaultSlug = useMemo(() => toSlug(promoterName) || 'promotor', [promoterName]);
  const [alias, setAlias] = useState('');
  const [request, setRequest] = useState<AliasRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRequest(readRequests().find((item) => item.promoterId === promoterId) ?? null);
  }, [promoterId]);

  const activeSlug =
    request?.status === 'approved' || request?.status === 'used' ? request.slug : defaultSlug;
  const displayedUrl = withSlug(link.url, activeSlug);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(displayedUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No pudimos copiar el enlace. Cópialo manualmente.');
    }
  }

  function requestAlias(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request) return;

    const slug = toSlug(alias);
    if (slug.length < 3) {
      setError('Usa al menos 3 caracteres entre letras, números y guiones.');
      return;
    }
    if (slug === defaultSlug) {
      setError('Elige un sobrenombre diferente de tu enlace automático.');
      return;
    }

    const requests = readRequests();
    const alreadyKnown = KNOWN_ALIASES.has(slug) || requests.some((item) => item.slug === slug);
    if (alreadyKnown) {
      setError('Ese sobrenombre ya está en uso. Prueba con otro.');
      toast.error('El sobrenombre no está disponible.');
      return;
    }

    const next: AliasRequest = {
      promoterId,
      slug,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...requests, next]));
    setRequest(next);
    setAlias(slug);
    setError(null);
    toast.success('Sobrenombre enviado para aprobación.');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <LinkSimple className="size-5 text-rose" weight="duotone" />
          <CardTitle>Tu enlace de promotor</CardTitle>
          <Badge variant={link.isActive ? 'success' : 'secondary'} className="ml-auto">
            {link.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <CardDescription>
          Comparte este enlace. Cada compra atribuida genera tu comisión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          <Input
            readOnly
            value={displayedUrl}
            aria-label="Enlace de promotor"
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 text-foreground"
            onClick={copyLink}
            aria-label="Copiar enlace de promotor"
          >
            {copied ? (
              <CheckCircle className="size-4 text-foreground" weight="duotone" />
            ) : (
              <Copy className="size-4 text-foreground" weight="duotone" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            Enlace automático:{' '}
            <span className="font-mono font-medium text-foreground">{defaultSlug}</span>
          </span>
          <span>
            Clics: <span className="font-medium text-foreground">{link.clicks}</span>
          </span>
        </div>

        {allowPersonalization ? (
          <form className="space-y-3 border-t border-border pt-4" onSubmit={requestAlias}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label htmlFor={`alias-${promoterId}`}>Personalizar una sola vez</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Solicita un sobrenombre único. El nuevo enlace se activará al ser aprobado.
                </p>
              </div>
              {request ? (
                <Badge variant={request.status === 'pending' ? 'warning' : 'success'}>
                  {request.status === 'pending' ? 'Pendiente de aprobación' : 'Personalizado'}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`alias-${promoterId}`}
                value={request?.slug ?? alias}
                onChange={(event) => {
                  setAlias(toSlug(event.target.value));
                  setError(null);
                }}
                placeholder="tu-sobrenombre"
                disabled={request !== null}
                aria-invalid={Boolean(error)}
              />
              <Button type="submit" variant="secondary" disabled={request !== null}>
                Solicitar cambio
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {request?.status === 'pending' ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Solicitaste <span className="font-mono text-foreground">{request.slug}</span>. No
                podrás enviar otro cambio mientras se revisa.
              </p>
            ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
