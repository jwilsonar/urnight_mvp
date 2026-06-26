import type { Metadata } from 'next';
import { AdminPromotersManager } from '@/components/admin/admin-promoters-manager';

export const metadata: Metadata = { title: 'Promotores — Administración' };

export default function AdminPromotersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Promotores</h1>
        <p className="text-sm text-muted-foreground">
          Crea promotores de tu empresa y sus códigos promocionales.
        </p>
      </div>
      <AdminPromotersManager />
    </div>
  );
}
