'use client';

import { CheckCircle, Copy, LinkSimple } from '@phosphor-icons/react';
import { useState } from 'react';
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
} from '@urnight/ui';

interface ReferralLinkCardProps {
  link: ReferralLinkResponse;
}

/** Tarjeta con el link de referido y copia al portapapeles. */
export function ReferralLinkCard({ link }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No pudimos copiar el enlace. Cópialo manualmente.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LinkSimple className="h-5 w-5 text-primary" weight="duotone" />
          <CardTitle>Tu enlace de referido</CardTitle>
          <Badge variant={link.isActive ? 'default' : 'secondary'} className="ml-auto">
            {link.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <CardDescription>
          Comparte este enlace. Cada compra atribuida genera tu comisión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input readOnly value={link.url} aria-label="Enlace de referido" className="font-mono text-sm" />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copiar enlace">
            {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            Código: <span className="font-mono font-medium text-foreground">{link.code}</span>
          </span>
          <span>
            Clics: <span className="font-medium text-foreground">{link.clicks}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
