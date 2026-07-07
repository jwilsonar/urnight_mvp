'use client';

import { Sparkle } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import type { PromoterResponse } from '@urnight/contracts';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@urnight/ui';
import { getMyPromoter } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { ErrorState } from '@/components/shared/error-state';

/**
 * Resuelve el promotor del usuario (`GET /promoters/me`) una sola vez y comparte
 * la lógica de carga / "aún no eres promotor" entre las sub-páginas del panel
 * (links, ventas, perfil). Render-prop con el promotor activo.
 */
export function PromoterGate({ children }: { children: (promoter: PromoterResponse) => ReactNode }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const meQuery = useQuery({
    queryKey: queryKeys.myPromoter,
    queryFn: () => getMyPromoter(token),
    enabled: status === 'authenticated' && Boolean(token),
  });

  if (status === 'loading' || meQuery.isPending) {
    return <Skeleton className="h-48 w-full rounded-md" />;
  }

  // Un 500 en /promoters/me NO es "aún no eres promotor" (M9): mostramos error+retry.
  if (meQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar tu perfil de promotor"
        description="Inténtalo de nuevo en unos minutos."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  const promoter = meQuery.data ?? null;
  if (!promoter) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle>Aún no eres promotor</CardTitle>
          </div>
          <CardDescription>
            Postula para gestionar tus links, ventas y comisiones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/promotor/postular">Postular a promotor</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children(promoter)}</>;
}
