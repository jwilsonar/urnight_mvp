'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, Skeleton } from '@urnight/ui';
import type { ReferralLinkResponse } from '@urnight/contracts';
import { getPromoterSales } from '@/lib/api/promoters';

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

/**
 * Fila de KPIs del dashboard RRPP del prototipo (pantalla 79), calculada con
 * datos reales de atribuciones (GET /promoters/:id/sales) y clicks del link.
 */
export function PromoterKpis({
  promoterId,
  referralLink,
}: {
  promoterId: string;
  referralLink: ReferralLinkResponse | null;
}) {
  const { data: session } = useSession();
  const salesQuery = useQuery({
    queryKey: ['promoter-kpis', promoterId],
    queryFn: () => getPromoterSales(promoterId, session?.accessToken),
    enabled: Boolean(session?.accessToken),
  });

  if (salesQuery.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const sales = salesQuery.data;
  const confirmed =
    sales?.attributions
      .filter((a) => a.status === 'confirmed')
      .reduce((sum, a) => sum + a.commissionAmount, 0) ?? 0;

  const kpis = [
    {
      label: 'Comisión total',
      value: PEN.format(sales?.totalCommission ?? 0),
      sub: 'Estimada + confirmada',
      tone: 'text-lavender',
    },
    {
      label: 'Comisión confirmada',
      value: PEN.format(confirmed),
      sub: 'Lista para liquidar',
      tone: 'text-success',
    },
    {
      label: 'Ventas atribuidas',
      value: String(sales?.totalAttributions ?? 0),
      sub: 'Compras con tu código',
      tone: 'text-lavender',
    },
    {
      label: 'Clicks en tu link',
      value: String(referralLink?.clicks ?? 0),
      sub: referralLink?.isActive ? 'Link activo' : 'Link inactivo',
      tone: referralLink?.isActive ? 'text-success' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="p-5">
          <p className="un-eyebrow !text-muted-foreground">{kpi.label}</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight">{kpi.value}</p>
          <p className={`mt-1 text-xs font-semibold ${kpi.tone}`}>{kpi.sub}</p>
        </Card>
      ))}
    </div>
  );
}
