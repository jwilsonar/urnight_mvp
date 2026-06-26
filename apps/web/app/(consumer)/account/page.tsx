import type { Metadata } from 'next';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { FavoritesList } from '@/components/account/favorites-list';
import { PreferencesForm } from '@/components/account/preferences-form';
import { RedemptionsList } from '@/components/account/redemptions-list';
import { getSession } from '@/lib/auth-helpers';

export const metadata: Metadata = { title: 'Perfil y ajustes' };

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuario',
  admin_local: 'Admin local',
  promoter: 'Promotor',
  validator: 'Validador',
  super_admin: 'Super admin',
};

export default async function AccountProfilePage() {
  const session = await getSession();
  const user = session?.user;
  const roles = user?.roles ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil</CardTitle>
          <CardDescription>Datos de tu cuenta (solo lectura).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span className="font-medium">{user?.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Correo</span>
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Roles</span>
            <div className="flex flex-wrap justify-end gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Usuario</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Favoritos</CardTitle>
          <CardDescription>Locales y eventos que guardaste.</CardDescription>
        </CardHeader>
        <CardContent>
          <FavoritesList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Canjes de promociones</CardTitle>
          <CardDescription>Códigos promocionales que usaste.</CardDescription>
        </CardHeader>
        <CardContent>
          <RedemptionsList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferencias</CardTitle>
          <CardDescription>Idioma y notificaciones de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}
