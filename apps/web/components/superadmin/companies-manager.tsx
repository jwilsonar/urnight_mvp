'use client';

import { Buildings } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@urnight/ui';
import type { CompanyResponse } from '@urnight/contracts';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { activateCompany, listCompanies, suspendCompany } from '@/lib/api/companies';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Etiquetas es-PE del estado de empresa (evita mostrar el enum crudo en inglés). */
const COMPANY_STATUS_LABEL: Record<CompanyResponse['status'], string> = {
  draft: 'Borrador',
  active: 'Activa',
  suspended: 'Suspendida',
};

/** Lista de empresas con suspender/activar (#16). super_admin. */
export function CompaniesManager() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const { data: companies, isLoading, isError, refetch } = useQuery({
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

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando empresas…</p>;
  // Distingue error de vacío (M9): un fallo del API no es "no hay empresas".
  if (isError) {
    return (
      <ErrorState
        title="No pudimos cargar las empresas"
        description="Inténtalo de nuevo en unos minutos."
        onRetry={() => void refetch()}
      />
    );
  }
  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={<Buildings weight="duotone" />}
        title="No hay empresas registradas"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>RUC</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">{company.commercialName}</TableCell>
            <TableCell className="text-muted-foreground">{company.ruc}</TableCell>
            <TableCell>
              <Badge variant={company.status === 'active' ? 'secondary' : 'outline'}>
                {COMPANY_STATUS_LABEL[company.status] ?? company.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {company.status === 'suspended' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activate.isPending}
                  onClick={() => activate.mutate(company.id)}
                >
                  Activar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={suspend.isPending}
                  onClick={() => suspend.mutate(company.id)}
                >
                  Suspender
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
