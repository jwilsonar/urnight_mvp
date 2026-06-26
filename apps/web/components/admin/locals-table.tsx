'use client';

import { CheckCircle, DotsThreeVertical, Gear, SealCheck } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Textarea,
} from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { listMyLocals, publishLocal, requestLocalVerification, suspendLocal } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDateOnly } from '@/lib/utils';
import { LocalStatusBadge, VerifiedBadge } from './status-badges';

const STATUS_FILTER = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Suspendido', value: 'suspended' },
];

function LocalRowActions({ local, token }: { local: LocalResponse; token: string }) {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const publish = useApiMutation({
    mutationFn: () => publishLocal(local.id, token),
    successMessage: 'Local publicado.',
    invalidateKeys: [queryKeys.myLocals],
  });
  const verify = useApiMutation({
    mutationFn: () => requestLocalVerification(local.id, {}, token),
    successMessage: 'Solicitud de verificación enviada.',
    invalidateKeys: [queryKeys.myLocals],
  });
  const suspend = useApiMutation({
    mutationFn: () => suspendLocal(local.id, { reason: reason.trim() }, token),
    successMessage: 'Local suspendido.',
    invalidateKeys: [queryKeys.myLocals],
    onSuccess: () => {
      setSuspendOpen(false);
      setReason('');
    },
  });

  const canPublish = local.status === 'draft' || local.status === 'inactive';
  const canSuspend = local.status !== 'suspended';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones">
            <DotsThreeVertical className="h-5 w-5" weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/panel/admin/locals/${local.id}`}>
              <Gear className="h-4 w-4" /> Gestionar
            </Link>
          </DropdownMenuItem>
          {canPublish ? (
            <DropdownMenuItem onSelect={() => publish.mutate(undefined)}>
              <CheckCircle className="h-4 w-4" /> Publicar
            </DropdownMenuItem>
          ) : null}
          {!local.isVerified ? (
            <DropdownMenuItem onSelect={() => verify.mutate(undefined)}>
              <SealCheck className="h-4 w-4" /> Solicitar verificación
            </DropdownMenuItem>
          ) : null}
          {canSuspend ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setSuspendOpen(true);
                }}
              >
                Suspender
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender local</DialogTitle>
            <DialogDescription>
              El local dejará de estar visible. Indica el motivo de la suspensión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`suspend-${local.id}`}>Motivo</Label>
            <Textarea
              id={`suspend-${local.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={255}
              placeholder="Motivo de la suspensión…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={suspend.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={suspend.isPending}
              onClick={() => {
                if (reason.trim().length < 3) {
                  toast.error('Indica un motivo (mínimo 3 caracteres).');
                  return;
                }
                suspend.mutate(undefined);
              }}
            >
              {suspend.isPending ? 'Suspendiendo…' : 'Suspender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Tabla de locales del administrador (búsqueda, filtro por estado, acciones). */
export function LocalsTable() {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';

  const query = useQuery({
    queryKey: queryKeys.myLocals,
    queryFn: () => listMyLocals(token),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const columns: ColumnDef<LocalResponse>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Nombre</SortableHeader>,
      cell: ({ row }) => (
        <Link href={`/panel/admin/locals/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => <LocalStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'isVerified',
      header: 'Verificación',
      cell: ({ row }) => <VerifiedBadge isVerified={row.original.isVerified} />,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableHeader column={column}>Creado</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateOnly(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <LocalRowActions local={row.original} token={token} />
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
      searchPlaceholder="Buscar local…"
      filters={[{ columnId: 'status', title: 'Estado', options: STATUS_FILTER }]}
    />
  );
}
