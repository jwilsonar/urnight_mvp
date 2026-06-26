import type { Metadata } from 'next';
import { CreateLocalDialog } from '@/components/admin/create-local-dialog';
import { LocalsTable } from '@/components/admin/locals-table';
import { PanelPageHeader } from '@/components/panels/panel-page-header';

export const metadata: Metadata = { title: 'Mis locales — Administración' };

export default function AdminLocalsPage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader title="Mis locales" description="Gestiona tus locales, eventos y entradas.">
        <CreateLocalDialog />
      </PanelPageHeader>

      <LocalsTable />
    </div>
  );
}
