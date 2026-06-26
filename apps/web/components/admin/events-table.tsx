'use client';

import { CheckCircle, DotsThreeVertical, Gear, PencilSimple } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Textarea,
} from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { cancelEvent, listMyEvents, publishEvent } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { EditEventDialog } from './edit-event-dialog';
import { EventStatusBadge } from './status-badges';

const STATUS_FILTER = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Programado', value: 'scheduled' },
  { label: 'Publicado', value: 'published' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Finalizado', value: 'finished' },
];

function EventRowActions({ event, token, localId }: { event: EventResponse; token: string; localId: string }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reason, setReason] = useState('');

  const publish = useApiMutation({
    mutationFn: () => publishEvent(event.id, token),
    successMessage: 'Evento publicado.',
    invalidateKeys: [queryKeys.events(localId)],
  });
  const cancel = useApiMutation({
    mutationFn: () => cancelEvent(event.id, { reason: reason.trim() }, token),
    successMessage: 'Evento cancelado.',
    invalidateKeys: [queryKeys.events(localId)],
    onSuccess: () => {
      setCancelOpen(false);
      setReason('');
    },
  });

  const canPublish = event.status === 'draft' || event.status === 'scheduled';
  const canCancel = event.status !== 'cancelled' && event.status !== 'finished';
  const canEdit = event.status !== 'cancelled' && event.status !== 'finished';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones">
            <DotsThreeVertical className="h-5 w-5" weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/panel/admin/events/${event.id}`}>
              <Gear className="h-4 w-4" /> Gestionar
            </Link>
          </DropdownMenuItem>
          {canEdit ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setEditOpen(true);
              }}
            >
              <PencilSimple className="h-4 w-4" /> Editar
            </DropdownMenuItem>
          ) : null}
          {canPublish ? (
            <DropdownMenuItem onSelect={() => publish.mutate(undefined)}>
              <CheckCircle className="h-4 w-4" /> Publicar
            </DropdownMenuItem>
          ) : null}
          {canCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setCancelOpen(true);
                }}
              >
                Cancelar evento
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEventDialog
        event={event}
        open={editOpen}
        onOpenChange={setEditOpen}
        invalidateKeys={[queryKeys.events(localId)]}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar evento</DialogTitle>
            <DialogDescription>Esta acción cancela el evento. Indica el motivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`cancel-${event.id}`}>Motivo</Label>
            <Textarea
              id={`cancel-${event.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              placeholder="Motivo de la cancelación…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => {
                if (reason.trim().length < 3) {
                  toast.error('Indica un motivo (mínimo 3 caracteres).');
                  return;
                }
                cancel.mutate(undefined);
              }}
            >
              {cancel.isPending ? 'Cancelando…' : 'Cancelar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Tabla de eventos de un local (búsqueda, filtro por estado, acciones). */
export function EventsTable({ localId }: { localId: string }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';

  const query = useQuery({
    queryKey: queryKeys.events(localId),
    queryFn: () => listMyEvents(token, localId),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const columns: ColumnDef<EventResponse>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Evento</SortableHeader>,
      cell: ({ row }) => (
        <Link href={`/panel/admin/events/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
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
      id: 'sold',
      header: 'Vendidas',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.ticketsSold}/{row.original.totalCapacity}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <EventRowActions event={row.original} token={token} localId={localId} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => query.refetch()}
      searchColumn="name"
      searchPlaceholder="Buscar evento…"
      filters={[{ columnId: 'status', title: 'Estado', options: STATUS_FILTER }]}
    />
  );
}
