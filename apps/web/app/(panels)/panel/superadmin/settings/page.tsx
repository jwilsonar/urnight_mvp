import type { Metadata } from 'next';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
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

      {/* Carta in-venue (demo): parámetros del módulo de pedidos dentro del local.
          Cuando exista el backend, estas claves viven en platform_setting. */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Carta in-venue</CardTitle>
            <Badge variant="info">Demo — llega con el backend de carta</Badge>
          </div>
          <CardDescription>
            Módulo de pedidos dentro del local: comisión de la plataforma por pedido y
            disponibilidad global.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border bg-surface p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Comisión por pedido
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold">8%</dd>
            </div>
            <div className="rounded-md border bg-surface p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Módulo habilitado
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold text-success">Sí</dd>
            </div>
            <div className="rounded-md border bg-surface p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Locales con carta activa
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold">3 / 4</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Los pagos en línea llegan con la pasarela + wallet; hoy el pedido se paga al
            recoger en barra. La comisión se liquidará sobre pedidos pagados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
