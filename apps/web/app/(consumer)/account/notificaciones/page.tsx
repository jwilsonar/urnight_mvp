import { Bell } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import type { NotificationResponse } from '@urnight/contracts';
import { Badge, Card, CardContent } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { getMyNotifications } from '@/lib/api/ops';
import { requireAccessToken } from '@/lib/auth-helpers';

export const metadata: Metadata = { title: 'Notificaciones' };

const STATUS_VARIANT: Record<NotificationResponse['status'], 'default' | 'secondary' | 'destructive'> = {
  queued: 'secondary',
  sent: 'default',
  failed: 'destructive',
};

const STATUS_LABEL: Record<NotificationResponse['status'], string> = {
  queued: 'En cola',
  sent: 'Enviada',
  failed: 'Fallida',
};

/** Notificaciones del usuario (GET /notifications/me). Solo lectura. */
export default async function NotificationsPage() {
  const { token } = await requireAccessToken('/account/notificaciones');

  let notifications: NotificationResponse[];
  try {
    notifications = await getMyNotifications(token);
  } catch {
    return (
      <ErrorState
        title="No pudimos cargar tus notificaciones"
        description="Inténtalo de nuevo en unos minutos."
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-10 w-10" weight="duotone" />}
        title="Sin notificaciones"
        description="Cuando tengas novedades sobre tus entradas o eventos aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <Card key={n.id}>
          <CardContent className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{n.subject ?? n.type}</p>
              <p className="text-xs text-muted-foreground">
                {n.channel === 'email' ? 'Correo' : 'Push'} ·{' '}
                {new Date(n.createdAt).toLocaleString('es-PE')}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[n.status]}>{STATUS_LABEL[n.status]}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
