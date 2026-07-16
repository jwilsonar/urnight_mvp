'use client';

import { Flag } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { CreateReportDto } from '@urnight/contracts';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@urnight/ui';
import { createReport } from '@/lib/api/trust';
import { useTokenAction } from '@/lib/hooks/use-token-action';

const REASONS: { value: CreateReportDto['reason']; label: string }[] = [
  { value: 'cancelled', label: 'El evento fue cancelado' },
  { value: 'wrong_price', label: 'Precio incorrecto' },
  { value: 'wrong_location', label: 'Ubicación incorrecta' },
  { value: 'unsafe', label: 'Situación insegura' },
  { value: 'other', label: 'Otro' },
];

interface ReportDialogProps {
  targetType: CreateReportDto['targetType'];
  targetId: string;
}

/** Reporta un local o evento. Requiere sesión; si no hay, lleva a login. */
export function ReportDialog({ targetType, targetId }: ReportDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { run, pending } = useTokenAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CreateReportDto['reason']>('other');
  const [comment, setComment] = useState('');

  if (!session?.user) {
    return (
      <Button
        variant="outline"
        size="sm"
        // callbackUrl: tras loguearse el usuario vuelve AQUÍ (al evento/local
        // que quería reportar), no al home.
        onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)}
      >
        <Flag className="h-4 w-4" /> Reportar
      </Button>
    );
  }

  function submit() {
    const dto: CreateReportDto = {
      targetType,
      ...(targetType === 'local' ? { localId: targetId } : { eventId: targetId }),
      reason,
      comment: comment.trim() ? comment : undefined,
      severity: 'low',
    };
    run((token) => createReport(dto, token), {
      successMessage: 'Reporte enviado. Gracias por avisarnos.',
      onSuccess: () => {
        setOpen(false);
        setComment('');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Outline: el botón necesita límites visibles (feedback de Piero); el
            hover sombreado del DS se conserva. */}
        <Button variant="outline" size="sm">
          <Flag className="h-4 w-4" /> Reportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar {targetType === 'local' ? 'local' : 'evento'}</DialogTitle>
          <DialogDescription>Cuéntanos qué está mal. Nuestro equipo lo revisará.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Motivo</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CreateReportDto['reason'])}>
              <SelectTrigger id="report-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-comment">Comentario (opcional)</Label>
            <Textarea
              id="report-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2000}
              placeholder="Describe el problema…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? 'Enviando…' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
