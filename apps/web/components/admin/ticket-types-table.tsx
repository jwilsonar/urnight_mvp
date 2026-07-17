'use client';

import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import type { TicketTypeResponse } from '@urnight/contracts';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { ProgressCell } from '@/components/panels/progress-cell';
import { listTicketTypes } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { formatPEN } from '@/lib/utils';
import { TicketStatusBadge, tierLabel } from './status-badges';

const STATUS_FILTER = [
  { label: 'Activo', value: 'active' },
  { label: 'Pausado', value: 'paused' },
  { label: 'Agotado', value: 'sold_out' },
];

/** Tabla de tipos de entrada de un evento (lectura: el backend no edita). */
export function TicketTypesTable({ eventId }: { eventId: string }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';

  const query = useQuery({
    queryKey: queryKeys.ticketTypes(eventId),
    queryFn: () => listTicketTypes(token, eventId),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const columns: ColumnDef<TicketTypeResponse>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Entrada</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'tierCode',
      header: 'Categoría',
      cell: ({ row }) => tierLabel(row.original.tierCode),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => <SortableHeader column={column}>Precio</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{formatPEN(row.original.price)}</span>,
    },
    {
      id: 'stock',
      header: 'Disponibles',
      cell: ({ row }) => {
        const { remaining, stock } = row.original;
        const availability = stock > 0 ? remaining / stock : 0;
        const tone = remaining <= 0 ? 'error' : availability <= 0.2 ? 'warning' : 'primary';

        return (
          <ProgressCell
            value={remaining}
            max={stock}
            tone={tone}
            ariaLabel={`Entradas disponibles: ${remaining} de ${stock}`}
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
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
      searchPlaceholder="Buscar entrada…"
      filters={[{ columnId: 'status', title: 'Estado', options: STATUS_FILTER }]}
    />
  );
}
