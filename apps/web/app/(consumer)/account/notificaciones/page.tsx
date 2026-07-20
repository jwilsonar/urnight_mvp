import { Bell } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import type { NotificationResponse } from '@urnight/contracts';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { PreferencesForm } from '@/components/account/preferences-form';
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

/** Actividad y personalización de notificaciones del usuario. */
export default async function NotificationsPage() {
  const { token } = await requireAccessToken('/account/notificaciones');

  let notifications: NotificationResponse[] | null = null;
  try {
    notifications = await getMyNotifications(token);
  } catch {
    // La personalización sigue disponible aunque falle el historial.
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personaliza tus notificaciones</CardTitle>
          <CardDescription>Elige cómo y sobre qué eventos quieres recibir avisos.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="notification-history-title">
        <h2 id="notification-history-title" className="font-heading text-lg font-bold">
          Actividad reciente
        </h2>
        {notifications === null ? (
          <ErrorState title="No pudimos cargar tus notificaciones" description="Inténtalo de nuevo en unos minutos." />
        ) : notifications.length === 0 ? (
          <EmptyState
            compact
            icon={<Bell className="h-10 w-10" weight="duotone" />}
            title="Sin notificaciones"
            description="Cuando tengas novedades sobre tus entradas o eventos aparecerán aquí."
          />
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{notification.subject ?? notification.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.channel === 'email' ? 'Correo' : 'Push'} ·{' '}
                    {new Date(notification.createdAt).toLocaleString('es-PE')}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[notification.status]}>{STATUS_LABEL[notification.status]}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
