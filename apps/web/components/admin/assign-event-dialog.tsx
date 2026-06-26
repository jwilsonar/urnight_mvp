'use client';

import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import type { EventResponse, PromoterResponse } from '@urnight/contracts';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { listMyEvents, listMyLocals } from '@/lib/api/admin';
import { listPromoterAssignments, unassignEvent } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { EventStatusBadge } from './status-badges';
import { TicketAllocationDialog } from './ticket-allocation-dialog';

type EventRow = EventResponse & { localName: string };
const sumBy = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Primer paso de la asignación: elige el evento. Reúne los eventos de todos los
 * locales de la empresa en una sola tabla (búsqueda, paginación y filtro por
 * local). Marca los ya asignados con su cupo y permite desasignarlos (sin afectar
 * los códigos ya canjeados). Al seleccionar uno, abre el modal de cupo/descuento.
 */
export function AssignEventDialog({
  promoter,
  open,
  onOpenChange,
}: {
  promoter: PromoterResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [selected, setSelected] = useState<EventResponse | null>(null);

  const localsQuery = useQuery({
    queryKey: queryKeys.myLocals,
    queryFn: () => listMyLocals(token),
    enabled: open && Boolean(token),
  });
  const locals = localsQuery.data ?? [];

  const eventsQueries = useQueries({
    queries: locals.map((l) => ({
      queryKey: queryKeys.events(l.id),
      queryFn: () => listMyEvents(token, l.id),
      enabled: open && Boolean(token),
    })),
  });

  const assignmentsQuery = useQuery({
    queryKey: queryKeys.promoterAssignments(promoter.id),
    queryFn: () => listPromoterAssignments(promoter.id, token),
    enabled: open && Boolean(token),
  });
  const assignmentByEvent = new Map(
    (assignmentsQuery.data ?? []).map((a) => [a.event.id, a] as const),
  );

  const localName = new Map(locals.map((l) => [l.id, l.name]));
  const rows: EventRow[] = eventsQueries.flatMap((q) =>
    (q.data ?? []).map((e) => ({ ...e, localName: localName.get(e.localId) ?? '—' })),
  );
  const isLoading =
    localsQuery.isPending || eventsQueries.some((q) => q.isPending) || assignmentsQuery.isPending;
  const isError = localsQuery.isError || eventsQueries.some((q) => q.isError);

  const unassign = useApiMutation({
    mutationFn: (promoterEventId: string) => unassignEvent(promoter.id, promoterEventId, token),
    successMessage: 'Evento desasignado. Los canjes ya realizados se conservan.',
    invalidateKeys: [queryKeys.promoterAssignments(promoter.id)],
    onSuccess: () => {
      void assignmentsQuery.refetch();
    },
  });

  const columns: ColumnDef<EventRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Evento</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'localId',
      header: 'Local',
      filterFn: 'equalsString',
      cell: ({ row }) => <span className="text-sm">{row.original.localName}</span>,
    },
    {
      accessorKey: 'startsAt',
      header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startsAt)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => <EventStatusBadge status={row.original.status} />,
    },
    {
      id: 'assigned',
      header: 'Asignado',
      cell: ({ row }) => {
        const a = assignmentByEvent.get(row.original.id);
        if (!a) return <span className="text-sm text-muted-foreground">—</span>;
        const allocated = sumBy(a.items.map((i) => i.allocatedStock));
        const remaining = sumBy(a.items.map((i) => i.remaining));
        return (
          <Badge variant="secondary">
            Cupo {remaining}/{allocated}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const a = assignmentByEvent.get(row.original.id);
        return (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(row.original)}>
              {a ? 'Editar' : 'Asignar'}
            </Button>
            {a ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={unassign.isPending}
                onClick={() => unassign.mutate(a.id)}
              >
                Desasignar
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const selectedAssignment = selected ? (assignmentByEvent.get(selected.id) ?? null) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar eventos a {promoter.name}</DialogTitle>
            <DialogDescription>
              Elige un evento de tu empresa para que el promotor lo promocione. Los eventos ya
              asignados muestran su cupo y puedes editarlos o desasignarlos.
            </DialogDescription>
          </DialogHeader>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => {
              void localsQuery.refetch();
              void assignmentsQuery.refetch();
              eventsQueries.forEach((q) => void q.refetch());
            }}
            searchColumn="name"
            searchPlaceholder="Buscar evento…"
            filters={[
              {
                columnId: 'localId',
                title: 'Local',
                options: locals.map((l) => ({ label: l.name, value: l.id })),
              },
            ]}
          />
        </DialogContent>
      </Dialog>

      <TicketAllocationDialog
        promoter={promoter}
        event={selected}
        existing={selectedAssignment}
        open={Boolean(selected)}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
        onAssigned={() => {
          setSelected(null);
          void assignmentsQuery.refetch();
        }}
      />
    </>
  );
}
