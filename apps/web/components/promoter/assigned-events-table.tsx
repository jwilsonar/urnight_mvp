'use client';

import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { CalendarBlank, Gear } from '@phosphor-icons/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { AssignmentResponse } from '@urnight/contracts';
import { Button } from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { listMyAssignments } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate } from '@/lib/utils';

const sumBy = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Tabla de eventos asignados al promotor, con acción "Gestionar" (códigos). */
export function AssignedEventsTable() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const query = useQuery({
    queryKey: queryKeys.myAssignments,
    queryFn: () => listMyAssignments(token),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const columns: ColumnDef<AssignmentResponse>[] = [
    {
      id: 'name',
      accessorFn: (row) => row.event.name,
      header: ({ column }) => <SortableHeader column={column}>Evento</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.event.name}</span>,
    },
    {
      id: 'date',
      accessorFn: (row) => row.event.startsAt,
      header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.event.startsAt)}</span>,
    },
    {
      id: 'types',
      header: 'Tipos',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.items.length}</span>
      ),
    },
    {
      id: 'cupo',
      header: 'Cupo restante',
      cell: ({ row }) => {
        const remaining = sumBy(row.original.items.map((i) => i.remaining));
        const allocated = sumBy(row.original.items.map((i) => i.allocatedStock));
        return (
          <span className="text-sm text-muted-foreground">
            {remaining}/{allocated}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Button asChild size="sm" variant="outline">
            <Link href={`/panel/promoter/events/${row.original.id}`}>
              <Gear className="h-4 w-4" /> Gestionar
            </Link>
          </Button>
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
      emptyState={
        <EmptyState
          icon={<CalendarBlank weight="duotone" />}
          title="Aún no tienes eventos asignados"
          description="Cuando un local te asigne un evento aparecerá aquí."
        />
      }
    />
  );
}
