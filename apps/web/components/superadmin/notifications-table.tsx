'use client';

import { DeviceMobile, EnvelopeSimple } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import type { NotificationResponse } from '@urnight/contracts';
import { Badge } from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { getMyNotifications } from '@/lib/api/ops';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<NotificationResponse['status'], string> = {
  queued: 'En cola',
  sent: 'Enviada',
  failed: 'Fallida',
};
const STATUS_VARIANT: Record<NotificationResponse['status'], 'secondary' | 'success' | 'destructive'> = {
  queued: 'secondary',
  sent: 'success',
  failed: 'destructive',
};
const CHANNEL_LABEL: Record<NotificationResponse['channel'], string> = { email: 'Correo', push: 'Push' };

const STATUS_FILTER = [
  { label: 'En cola', value: 'queued' },
  { label: 'Enviada', value: 'sent' },
  { label: 'Fallida', value: 'failed' },
];
const CHANNEL_FILTER = [
  { label: 'Correo', value: 'email' },
  { label: 'Push', value: 'push' },
];

/** Tabla de notificaciones del super admin (búsqueda, filtros, paginación). */
export function NotificationsTable() {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';

  const query = useQuery({
    queryKey: queryKeys.notificationsMe,
    queryFn: () => getMyNotifications(token),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const columns: ColumnDef<NotificationResponse>[] = [
    {
      accessorKey: 'subject',
      header: 'Asunto',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.channel === 'push' ? (
            <DeviceMobile className="h-4 w-4 shrink-0 text-primary" weight="duotone" />
          ) : (
            <EnvelopeSimple className="h-4 w-4 shrink-0 text-primary" weight="duotone" />
          )}
          <span className="font-medium">{row.original.subject ?? row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Canal',
      filterFn: 'equalsString',
      cell: ({ row }) => CHANNEL_LABEL[row.original.channel],
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => query.refetch()}
      searchColumn="subject"
      searchPlaceholder="Buscar notificación…"
      filters={[
        { columnId: 'channel', title: 'Canal', options: CHANNEL_FILTER },
        { columnId: 'status', title: 'Estado', options: STATUS_FILTER },
      ]}
    />
  );
}
