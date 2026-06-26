import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { CompanyProfileForm } from '@/components/admin/company-profile-form';

export const metadata: Metadata = { title: 'Mi empresa' };

export default function AdminCompanyPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mi empresa</CardTitle>
          <CardDescription>Nombre comercial y datos de contacto (#29).</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
