'use client';

import { Flag } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';
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
  const [commentError, setCommentError] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);

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
    const cleanComment = comment.trim();
    if (reason === 'other' && !cleanComment) {
      setCommentError('Describe el motivo del reporte.');
      commentRef.current?.focus();
      return;
    }

    const dto: CreateReportDto = {
      targetType,
      ...(targetType === 'local' ? { localId: targetId } : { eventId: targetId }),
      reason,
      comment: cleanComment || undefined,
      severity: 'low',
    };
    run((token) => createReport(dto, token), {
      successMessage: 'Reporte enviado. Gracias por avisarnos.',
      onSuccess: () => {
        setOpen(false);
        setComment('');
        setCommentError('');
        if (commentRef.current) commentRef.current.style.height = 'auto';
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
            <Select
              value={reason}
              onValueChange={(value) => {
                const nextReason = value as CreateReportDto['reason'];
                setReason(nextReason);
                if (nextReason !== 'other') setCommentError('');
              }}
            >
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
            <Label htmlFor="report-comment">Comentario{reason === 'other' ? '' : ' (opcional)'}</Label>
            <Textarea
              ref={commentRef}
              id="report-comment"
              value={comment}
              onChange={(event) => {
                const textarea = event.currentTarget;
                setComment(textarea.value);
                if (textarea.value.trim()) setCommentError('');
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
              }}
              maxLength={2000}
              required={reason === 'other'}
              aria-invalid={Boolean(commentError)}
              aria-describedby={commentError ? 'report-comment-error' : undefined}
              className="min-h-24 max-h-48 resize-none overflow-y-auto"
              placeholder="Describe el problema…"
            />
            {commentError ? (
              <p id="report-comment-error" className="text-sm text-destructive" role="alert">
                {commentError}
              </p>
            ) : null}
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
