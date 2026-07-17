'use client';

import { ArrowClockwise, ChartLineUp, Receipt } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { PromoterSalesResponse } from '@urnight/contracts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Separator,
  Skeleton,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { getErrorMessage } from '@/lib/api/error-messages';
import { getPromoterSales } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate, formatPEN } from '@/lib/utils';

const STATUS_LABELS: Record<
  PromoterSalesResponse['attributions'][number]['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  estimated: { label: 'Estimada', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  void: { label: 'Anulada', variant: 'destructive' },
};

interface PromoterSalesProps {
  /** ID del promotor; si falta, se muestra un placeholder. */
  promoterId?: string;
}

/** Comisiones y atribuciones del promotor (GET /promoters/:id/sales). */
export function PromoterSales({ promoterId }: PromoterSalesProps) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const query = useQuery<PromoterSalesResponse>({
    queryKey: queryKeys.promoterSales(promoterId ?? 'none'),
    queryFn: () => getPromoterSales(promoterId as string, token),
    enabled: Boolean(promoterId) && status === 'authenticated' && Boolean(token),
  });

  if (!promoterId) {
    return (
      <EmptyState
        icon={<ChartLineUp className="h-10 w-10" weight="duotone" />}
        title="Aún no hay ventas que mostrar"
        description="Tus comisiones aparecerán aquí una vez que se cree tu perfil de promotor. Crea o selecciona un promotor para ver sus atribuciones."
      />
    );
  }

  if (query.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          <ArrowClockwise className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  const sales = query.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Comisión total"
          value={formatPEN(sales.totalCommission)}
          hint="Estimada + confirmada"
          tone="accent"
        />
        <StatCard
          label="Atribuciones"
          value={sales.totalAttributions}
          hint="Compras con tu código"
          tone="muted"
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <ArrowClockwise className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {sales.attributions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-10 w-10" weight="duotone" />}
          title="Sin atribuciones todavía"
          description="Cuando una compra use tu enlace o código, aparecerá aquí con su comisión."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium uppercase text-muted-foreground sm:grid">
              <span>Orden / Fecha</span>
              <span className="text-right">Comisión</span>
              <span className="text-right">Estado</span>
            </div>
            <ul className="divide-y">
              {sales.attributions.map((attribution) => {
                const statusMeta = STATUS_LABELS[attribution.status];
                return (
                  <li
                    key={attribution.orderId}
                    className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{attribution.orderId}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attribution.attributedAt)}
                      </p>
                    </div>
                    <p className="font-medium sm:text-right">
                      {formatPEN(attribution.commissionAmount)}
                    </p>
                    <div className="sm:text-right">
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Separator />
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">Total</span>
              <span className="font-semibold">{formatPEN(sales.totalCommission)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
