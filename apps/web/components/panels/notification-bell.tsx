'use client';

import { Bell, BellSlash, EnvelopeSimple, DeviceMobile } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@urnight/ui';
import type { NotificationResponse } from '@urnight/contracts';
import { EmptyState } from '@/components/shared/empty-state';
import { getMyNotifications } from '@/lib/api/ops';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate } from '@/lib/utils/format';
import { hasRole } from '@/lib/utils/rbac';

const STATUS_VARIANT: Record<NotificationResponse['status'], 'secondary' | 'success' | 'destructive'> = {
  queued: 'secondary',
  sent: 'success',
  failed: 'destructive',
};

const STATUS_LABEL: Record<NotificationResponse['status'], string> = {
  queued: 'En cola',
  sent: 'Enviado',
  failed: 'Falló',
};

/** Campana de notificaciones en el navbar del panel. Lectura (sin mark-read). */
export function NotificationBell() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const isSuperAdmin = hasRole(session?.user?.roles, 'super_admin');

  const query = useQuery({
    queryKey: queryKeys.notificationsMe,
    queryFn: () => getMyNotifications(token),
    enabled: status === 'authenticated' && Boolean(token),
  });
  // Un fallo del API no debe leerse como "sin notificaciones" (M9): sin badge ni lista vacía.

  const notifications = query.data ?? [];
  const unread = notifications.filter((n) => n.status === 'queued').length;
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {query.isPending ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : query.isError ? (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">No pudimos cargar tus notificaciones.</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            compact
            icon={<BellSlash weight="duotone" />}
            title="Sin notificaciones"
          />
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {recent.map((n) => {
              const Icon = n.channel === 'push' ? DeviceMobile : EnvelopeSimple;
              return (
                <li key={n.id} className="flex items-start gap-3 px-2 py-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="duotone" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{n.subject ?? n.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[n.status]} className="shrink-0">
                    {STATUS_LABEL[n.status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
        {isSuperAdmin ? (
          <>
            <DropdownMenuSeparator />
            <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
              <Link href="/panel/superadmin/notifications">Ver todas</Link>
            </Button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
