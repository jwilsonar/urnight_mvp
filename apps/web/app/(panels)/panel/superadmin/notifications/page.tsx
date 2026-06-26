import type { Metadata } from 'next';
import { NotificationsTable } from '@/components/superadmin/notifications-table';

export const metadata: Metadata = { title: 'Notificaciones' };

export default function SuperAdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Notificaciones enviadas a tu cuenta de super administrador.
        </p>
      </header>

      <NotificationsTable />
    </div>
  );
}
