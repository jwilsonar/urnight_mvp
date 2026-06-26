'use client';

import { CheckCircle, SealCheck } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { LocalResponse } from '@urnight/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Textarea,
} from '@urnight/ui';
import { publishLocal, requestLocalVerification, suspendLocal } from '@/lib/api/admin';
import { useTokenAction } from '@/lib/hooks/use-token-action';

export function LocalActions({ local }: { local: LocalResponse }) {
  const router = useRouter();
  const { run, pending } = useTokenAction();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const canPublish = local.status === 'draft' || local.status === 'inactive';
  const canSuspend = local.status !== 'suspended';

  function onPublish() {
    run((token) => publishLocal(local.id, token), {
      successMessage: 'Local publicado.',
      onSuccess: () => router.refresh(),
    });
  }

  function onRequestVerification() {
    run((token) => requestLocalVerification(local.id, {}, token), {
      successMessage: 'Solicitud de verificación enviada.',
      onSuccess: () => router.refresh(),
    });
  }

  function onSuspend() {
    if (reason.trim().length < 3) {
      toast.error('Indica un motivo (mínimo 3 caracteres).');
      return;
    }
    run((token) => suspendLocal(local.id, { reason: reason.trim() }, token), {
      onSuccess: () => {
        toast.success('Local suspendido.');
        setSuspendOpen(false);
        setReason('');
        router.refresh();
      },
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canPublish ? (
        <Button onClick={onPublish} disabled={pending}>
          <CheckCircle className="h-4 w-4" weight="duotone" />
          Publicar
        </Button>
      ) : null}

      {!local.isVerified ? (
        <Button variant="outline" onClick={onRequestVerification} disabled={pending}>
          <SealCheck className="h-4 w-4" weight="duotone" />
          Solicitar verificación
        </Button>
      ) : null}

      {canSuspend ? (
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              Suspender
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspender local</DialogTitle>
              <DialogDescription>
                El local dejará de estar visible. Indica el motivo de la suspensión.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Motivo</Label>
              <Textarea
                id="suspend-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={255}
                placeholder="Motivo de la suspensión…"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={onSuspend} disabled={pending}>
                {pending ? 'Suspendiendo…' : 'Suspender'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
