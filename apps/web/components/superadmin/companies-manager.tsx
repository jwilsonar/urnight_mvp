'use client';

import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import type { CompanyResponse } from '@urnight/contracts';
import { Badge, Button } from '@urnight/ui';
import { DataTable, SortableHeader } from '@/components/panels/data-table';
import { activateCompany, listCompanies, suspendCompany } from '@/lib/api/companies';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Etiquetas es-PE del estado de empresa (evita mostrar el enum crudo en inglés). */
const COMPANY_STATUS_LABEL: Record<CompanyResponse['status'], string> = {
  draft: 'Borrador',
  active: 'Activa',
  suspended: 'Suspendida',
};

const COMPANY_STATUS_FILTER = Object.entries(COMPANY_STATUS_LABEL).map(([value, label]) => ({
  label,
  value,
}));

/** Lista de empresas con suspender/activar (#16). super_admin. */
export function CompaniesManager() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const { data: companies, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.companies,
    queryFn: () => listCompanies(token),
    enabled: Boolean(token),
  });

  const suspend = useApiMutation({
    mutationFn: (id: string) => suspendCompany(id, token),
    successMessage: 'Empresa suspendida.',
    invalidateKeys: [queryKeys.companies],
  });
  const activate = useApiMutation({
    mutationFn: (id: string) => activateCompany(id, token),
    successMessage: 'Empresa activada.',
    invalidateKeys: [queryKeys.companies],
  });

  const columns: ColumnDef<CompanyResponse>[] = [
    {
      accessorKey: 'commercialName',
      header: ({ column }) => <SortableHeader column={column}>Empresa</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.commercialName}</span>,
    },
    {
      accessorKey: 'ruc',
      header: 'RUC',
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.ruc}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'secondary' : 'outline'}>
          {COMPANY_STATUS_LABEL[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex min-w-28 justify-start">
          {row.original.status === 'suspended' ? (
            <Button
              size="sm"
              variant="outline"
              className="min-w-24 text-foreground"
              disabled={activate.isPending}
              onClick={() => activate.mutate(row.original.id)}
            >
              Activar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="min-w-24 text-foreground"
              disabled={suspend.isPending}
              onClick={() => suspend.mutate(row.original.id)}
            >
              Suspender
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={companies ?? []}
      isLoading={isPending}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="commercialName"
      searchPlaceholder="Buscar empresa…"
      filters={[{ columnId: 'status', title: 'Estado', options: COMPANY_STATUS_FILTER }]}
    />
  );
}
