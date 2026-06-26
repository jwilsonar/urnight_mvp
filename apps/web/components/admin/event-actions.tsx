'use client';

import { CheckCircle } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { EventResponse } from '@urnight/contracts';
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
import { cancelEvent, publishEvent } from '@/lib/api/admin';
import { useTokenAction } from '@/lib/hooks/use-token-action';
import { EditEventButton } from './edit-event-dialog';

export function EventActions({ event }: { event: EventResponse }) {
  const router = useRouter();
  const { run, pending } = useTokenAction();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const canPublish = event.status === 'draft' || event.status === 'scheduled';
  const canCancel = event.status !== 'cancelled' && event.status !== 'finished';
  const canEdit = event.status !== 'cancelled' && event.status !== 'finished';

  function onPublish() {
    run((token) => publishEvent(event.id, token), {
      onSuccess: () => {
        toast.success('Evento publicado.');
        router.refresh();
      },
    });
  }

  function onCancel() {
    if (reason.trim().length < 3) {
      toast.error('Indica un motivo (mínimo 3 caracteres).');
      return;
    }
    run((token) => cancelEvent(event.id, { reason: reason.trim() }, token), {
      onSuccess: () => {
        toast.success('Evento cancelado.');
        setCancelOpen(false);
        setReason('');
        router.refresh();
      },
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit ? (
        <EditEventButton event={event} onUpdated={() => router.refresh()} />
      ) : null}

      {canPublish ? (
        <Button onClick={onPublish} disabled={pending}>
          <CheckCircle className="h-4 w-4" weight="duotone" />
          Publicar
        </Button>
      ) : null}

      {canCancel ? (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              Cancelar evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar evento</DialogTitle>
              <DialogDescription>
                Esta acción cancela el evento. Indica el motivo de la cancelación.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(event_) => setReason(event_.target.value)}
                maxLength={255}
                placeholder="Motivo de la cancelación…"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={pending}>
                Volver
              </Button>
              <Button variant="destructive" onClick={onCancel} disabled={pending}>
                {pending ? 'Cancelando…' : 'Cancelar evento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
