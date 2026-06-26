import type { Metadata } from 'next';
import { CompaniesManager } from '@/components/superadmin/companies-manager';

export const metadata: Metadata = { title: 'Empresas' };

export default function SuperadminCompaniesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona el estado de las empresas de la plataforma (#16).
        </p>
      </header>
      <CompaniesManager />
    </div>
  );
}
