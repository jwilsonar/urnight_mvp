'use client';

import { Megaphone, Sparkle, Ticket, TrendUp } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@urnight/ui';
import { getMyPromoter } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { ApplyPromoterForm } from './apply-promoter-form';
import { AssignedEventsTable } from './assigned-events-table';
import { PromoCodeValidator } from './promo-code-validator';
import { PromoterKpis } from './promoter-kpis';
import { PromoterSales } from './promoter-sales';
import { ReferralLinkCard } from './referral-link-card';

/**
 * Dashboard del promotor. Resuelve la sesión → promotor (`GET /promoters/me`):
 * - Si NO es promotor: muestra el formulario de postulación.
 * - Si es promotor activo: muestra su link de referido, los eventos que le fueron
 *   asignados a promocionar (con acción "Gestionar") y sus comisiones.
 */
export function PromoterDashboard() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const meQuery = useQuery({
    queryKey: queryKeys.myPromoter,
    queryFn: () => getMyPromoter(token),
    enabled: status === 'authenticated' && Boolean(token),
  });

  const promoter = meQuery.data ?? null;
  const loading = status === 'loading' || meQuery.isPending;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" weight="duotone" />
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Panel de promotor</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Gestiona los eventos que te asignaron, genera códigos de entrada gratis y sigue tus
          comisiones.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      ) : promoter ? (
        <div className="space-y-8">
          {/* KPIs del prototipo (pantalla 79), con datos reales de atribuciones. */}
          <PromoterKpis promoterId={promoter.id} referralLink={promoter.referralLink} />
          {promoter.referralLink ? <ReferralLinkCard link={promoter.referralLink} /> : null}

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="events">
                <Ticket className="mr-2 h-4 w-4" />
                Eventos asignados
              </TabsTrigger>
              <TabsTrigger value="sales">
                <TrendUp className="mr-2 h-4 w-4" />
                Comisiones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-semibold">Eventos a promocionar</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona los códigos de cada evento que te asignaron.
                </p>
              </div>
              <Separator />
              <AssignedEventsTable />
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-semibold">Comisiones y ventas</h2>
                <p className="text-sm text-muted-foreground">
                  Atribuciones de compras asociadas a tu promotor.
                </p>
              </div>
              <Separator />
              <PromoterSales promoterId={promoter.id} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-primary" weight="duotone" />
              <CardTitle>Postula a promotor</CardTitle>
            </div>
            <CardDescription>
              ¿Aún no eres promotor? Envía tu postulación y un administrador la revisará.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ApplyPromoterForm />
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Previsualiza un código</p>
              <PromoCodeValidator />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
