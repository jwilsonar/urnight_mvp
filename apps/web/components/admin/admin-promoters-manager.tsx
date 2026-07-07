'use client';

import { CalendarPlus, PaperPlaneTilt, Plus, Tag } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { PromoterResponse } from '@urnight/contracts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Skeleton,
} from '@urnight/ui';
import { CreatePromoterForm } from '@/components/promoter/create-promoter-form';
import { PromoCodeForm } from '@/components/promoter/promo-code-form';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { listMyPromoters } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { AssignEventDialog } from './assign-event-dialog';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  inactive: 'Inactivo',
};

/**
 * Gestión de promotores del panel admin_local. Lista los promotores de la
 * empresa del actor (`GET /promoters/mine`, aislado por tenant) y permite
 * invitar nuevos + crear códigos promocionales.
 */
export function AdminPromotersManager() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const [promoter, setPromoter] = useState<PromoterResponse | null>(null);
  const [promoterOpen, setPromoterOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [assignTo, setAssignTo] = useState<PromoterResponse | null>(null);

  const promotersQuery = useQuery({
    queryKey: queryKeys.myPromoters,
    queryFn: () => listMyPromoters(token),
    enabled: status === 'authenticated' && Boolean(token),
  });
  const promoters = promotersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={promoterOpen} onOpenChange={setPromoterOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" weight="bold" />
              Crear promotor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear promotor</DialogTitle>
              <DialogDescription>
                Invita a un promotor por su correo. Recibirá una solicitud que debe confirmar; al
                aceptarla se activa y obtiene su enlace de referido.
              </DialogDescription>
            </DialogHeader>
            <CreatePromoterForm
              onCreated={(created) => {
                setPromoter(created);
                setPromoterOpen(false);
                void promotersQuery.refetch();
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Tag className="h-4 w-4" weight="bold" />
              Crear código
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear código promocional</DialogTitle>
              <DialogDescription>
                Define el descuento, su alcance y un cupo de usos opcional.
                {promoter ? ' Se vinculará al promotor recién creado.' : ''}
              </DialogDescription>
            </DialogHeader>
            <PromoCodeForm promoterId={promoter?.id} onCreated={() => setPromoOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis promotores</CardTitle>
          <CardDescription>Promotores de tu empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          {promotersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : promotersQuery.isError ? (
            // Distingue error de "sin promotores" (M9): no ocultes un 500 como vacío.
            <ErrorState
              title="No pudimos cargar tus promotores"
              description="Inténtalo de nuevo en unos minutos."
              onRetry={() => void promotersQuery.refetch()}
            />
          ) : promoters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no tienes promotores. Invita al primero arriba.
            </p>
          ) : (
            <ul className="divide-y">
              {promoters.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.invitedEmail ? (
                      <p className="truncate text-xs text-muted-foreground">{p.invitedEmail}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setAssignTo(p)}>
                        <CalendarPlus className="h-4 w-4" weight="bold" />
                        Asignar eventos
                      </Button>
                    ) : null}
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {promoter ? (
        <Card>
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <PaperPlaneTilt className="h-5 w-5" weight="duotone" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Invitación enviada</CardTitle>
              <CardDescription>
                {promoter.invitedEmail
                  ? `Enviamos la solicitud a ${promoter.invitedEmail}. `
                  : `Invitación creada para "${promoter.name}". `}
                El promotor debe confirmarla desde su cuenta; al aceptar se activa su enlace de
                referido.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Tag className="h-8 w-8" weight="duotone" />}
              title="Códigos promocionales"
              description="Genera códigos vinculados una vez el promotor confirme su asociación."
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Tag className="h-8 w-8" weight="duotone" />}
          title="Gestiona tus promotores"
          description="Invita a un promotor por su correo: recibirá una solicitud para confirmar y, al aceptar, obtendrá su enlace de referido."
        />
      )}

      {assignTo ? (
        <AssignEventDialog
          promoter={assignTo}
          open={Boolean(assignTo)}
          onOpenChange={(o) => {
            if (!o) setAssignTo(null);
          }}
        />
      ) : null}
    </div>
  );
}
