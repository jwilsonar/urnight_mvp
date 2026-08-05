'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { AuditLogResponse } from '@urnight/contracts';
import { Badge } from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<AuditLogResponse>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Acción',
    filterFn: 'equalsString',
    cell: ({ row }) => <span className="font-medium">{row.original.action}</span>,
  },
  {
    accessorKey: 'entityType',
    header: 'Entidad',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{row.original.entityType}</Badge>
        {row.original.entityId ? (
          <span
            className="inline-block max-w-32 truncate align-bottom font-mono text-xs text-muted-foreground"
            title={row.original.entityId}
          >
            {row.original.entityId}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'actorUserId',
    header: 'Actor',
    cell: ({ row }) =>
      row.original.actorUserId ? (
        <span
          className="inline-block max-w-32 truncate align-bottom font-mono text-xs text-muted-foreground"
          title={row.original.actorUserId}
        >
          {row.original.actorUserId}
        </span>
      ) : (
        '—'
      ),
  },
];

/** Tabla navegable de acciones sensibles registradas en AUDIT_LOG. */
export function AuditTable({ logs }: { logs: AuditLogResponse[] }) {
  const actionOptions = [...new Set(logs.map((log) => log.action))]
    .sort((left, right) => left.localeCompare(right, 'es'))
    .map((action) => ({ label: action, value: action }));

  return (
    <DataTable
      columns={columns}
      data={logs}
      filters={[{ columnId: 'action', title: 'Acción', options: actionOptions }]}
    />
  );
}
