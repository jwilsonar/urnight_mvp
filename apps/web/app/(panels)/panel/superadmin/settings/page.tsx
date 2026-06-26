import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { PlatformSettingEditor } from '@/components/superadmin/platform-setting-editor';

export const metadata: Metadata = { title: 'Configuración de plataforma' };

export default function SuperAdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Configuración de plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Consulta y actualiza ajustes operativos identificados por clave.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Editor de ajustes</CardTitle>
          <CardDescription>
            La plataforma no expone un listado de ajustes; trabaja por clave directa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSettingEditor />
        </CardContent>
      </Card>
    </div>
  );
}
