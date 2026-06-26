'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { AssignmentResponse, EventResponse, PromoterResponse } from '@urnight/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
} from '@urnight/ui';
import { listTicketTypes } from '@/lib/api/admin';
import { assignEventToPromoter } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/**
 * Segundo paso de la asignación: define cupo + descuento por tipo de entrada.
 * El descuento está bloqueado a 100% (entrada gratis) en el MVP; el backend
 * guarda el valor para honrar descuentos parciales cuando entre la pasarela.
 * El "cupo" (allocatedStock) acota cuántos códigos podrá generar el promotor.
 */
export function TicketAllocationDialog({
  promoter,
  event,
  existing,
  open,
  onOpenChange,
  onAssigned,
}: {
  promoter: PromoterResponse;
  event: EventResponse | null;
  /** Asignación previa de este evento (si ya estaba asignado) para precargar cupos. */
  existing?: AssignmentResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [cupos, setCupos] = useState<Record<string, string>>({});

  const ttQuery = useQuery({
    queryKey: queryKeys.ticketTypes(event?.id ?? 'none'),
    queryFn: () => listTicketTypes(token, event!.id),
    enabled: open && Boolean(event) && Boolean(token),
  });
  const ticketTypes = ttQuery.data ?? [];

  // Precarga los cupos de la asignación previa cuando se abre el modal (edición).
  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    for (const it of existing?.items ?? []) seed[it.ticketTypeId] = String(it.allocatedStock);
    setCupos(seed);
  }, [open, existing]);

  // Una fila es inválida si su cupo supera el stock disponible del tipo.
  const invalid = useMemo(
    () =>
      ticketTypes.some((tt) => {
        const cupo = Number.parseInt(cupos[tt.id] ?? '', 10);
        return Number.isFinite(cupo) && cupo > tt.remaining;
      }),
    [ticketTypes, cupos],
  );

  const items = useMemo(
    () =>
      ticketTypes
        .map((tt) => ({ tt, cupo: Number.parseInt(cupos[tt.id] ?? '', 10) }))
        .filter(({ tt, cupo }) => Number.isFinite(cupo) && cupo > 0 && cupo <= tt.remaining)
        .map(({ tt, cupo }) => ({
          ticketTypeId: tt.id,
          discountType: 'percentage' as const,
          discountValue: 100,
          allocatedStock: cupo,
        })),
    [ticketTypes, cupos],
  );

  const assign = useApiMutation({
    mutationFn: () =>
      assignEventToPromoter(promoter.id, { eventId: event!.id, items }, token),
    successMessage: 'Evento asignado al promotor.',
    invalidateKeys: [queryKeys.promoterAssignments(promoter.id)],
    onSuccess: () => {
      setCupos({});
      onAssigned();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cupo por tipo de entrada</DialogTitle>
          <DialogDescription>
            {event ? <>Evento «{event.name}» para {promoter.name}. </> : null}
            Asigna cuántas entradas gratis puede repartir el promotor por tipo. El descuento está
            fijado en 100% (entrada gratis) en esta etapa.
          </DialogDescription>
        </DialogHeader>

        {ttQuery.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este evento aún no tiene tipos de entrada. Créalos antes de asignarlo.
          </p>
        ) : (
          <div className="space-y-3">
            {ticketTypes.map((tt) => {
              const cupo = Number.parseInt(cupos[tt.id] ?? '', 10);
              const exceeds = Number.isFinite(cupo) && cupo > tt.remaining;
              return (
                <div
                  key={tt.id}
                  className="grid grid-cols-[1fr_auto_auto] items-start gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0 pt-1">
                    <p className="truncate text-sm font-medium">{tt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Disponible: {tt.remaining} de {tt.stock} · {tt.currency} {tt.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descuento</Label>
                    <Input className="w-20" value="100%" disabled aria-label="Descuento" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`cupo-${tt.id}`} className="text-xs text-muted-foreground">
                      Cupo
                    </Label>
                    <Input
                      id={`cupo-${tt.id}`}
                      type="number"
                      min={0}
                      max={tt.remaining}
                      placeholder="0"
                      aria-invalid={exceeds}
                      className={`w-20 ${exceeds ? 'border-destructive' : ''}`}
                      value={cupos[tt.id] ?? ''}
                      onChange={(e) => setCupos((prev) => ({ ...prev, [tt.id]: e.target.value }))}
                    />
                    {exceeds ? (
                      <p className="text-xs text-destructive">Máx. {tt.remaining}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assign.isPending}>
            Volver
          </Button>
          <Button
            disabled={assign.isPending || ticketTypes.length === 0 || invalid}
            onClick={() => {
              if (invalid) {
                toast.error('El cupo no puede superar las entradas disponibles.');
                return;
              }
              if (items.length === 0) {
                toast.error('Asigna un cupo (mayor a 0) en al menos un tipo de entrada.');
                return;
              }
              assign.mutate(undefined);
            }}
          >
            {assign.isPending ? 'Guardando…' : existing ? 'Guardar cambios' : 'Asignar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
