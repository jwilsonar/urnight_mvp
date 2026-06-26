'use client';

import { Ticket } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { listMyRedemptions } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';

/** Canjes de códigos promocionales del usuario (#13). GET /me/redemptions. */
export function RedemptionsList() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myRedemptions,
    queryFn: () => listMyRedemptions(token),
    enabled: Boolean(token),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando canjes…</p>;
  }
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no has canjeado códigos.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((redemption) => (
        <li key={redemption.id} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Ticket className="size-4 text-primary" weight="fill" />
            Descuento S/ {redemption.discountApplied.toFixed(2)}
          </span>
          <span className="text-muted-foreground">
            {new Date(redemption.redeemedAt).toLocaleDateString('es-PE')}
          </span>
        </li>
      ))}
    </ul>
  );
}
