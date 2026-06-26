import { DeviceMobile, QrCode, WifiSlash } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { requireRole } from '@/lib/auth-helpers';

export const metadata: Metadata = {
  title: 'Panel de validador',
  description: 'Escaneo de entradas en puerta con la app de validación UrNight.',
};

const STEPS = [
  {
    icon: DeviceMobile,
    title: 'Abre la app de validación',
    description: 'Inicia sesión con este mismo correo en la app UrNight Validador del dispositivo de puerta.',
  },
  {
    icon: QrCode,
    title: 'Escanea el QR de cada entrada',
    description: 'La app marca la entrada como usada y registra el check-in del evento en tiempo real.',
  },
  {
    icon: WifiSlash,
    title: 'Funciona sin conexión',
    description: 'Los check-ins se guardan localmente y se sincronizan al recuperar señal: la puerta nunca se detiene.',
  },
];

/**
 * Landing del validador. La validación de QR vive en la app nativa de puerta
 * (offline-first, §5); aquí dejamos el acceso del rol y las instrucciones. El
 * gate de rol está en el layout y lo reforzamos aquí.
 */
export default async function ValidatorPage() {
  const session = await requireRole(['validator', 'super_admin'], '/panel');

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Hola, {session.user.name}</h1>
        <p className="max-w-2xl text-muted-foreground">
          Tu rol valida el ingreso a los eventos de tu local. El escaneo de entradas se realiza desde la{' '}
          <strong className="text-foreground">app de validación UrNight</strong> en el dispositivo de puerta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="h-full">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary" weight="duotone" />
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Problemas en la puerta?</CardTitle>
          <CardDescription>Reporta incidencias del escáner al administrador de tu local o a soporte.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Soporte: <a className="font-medium text-primary hover:underline" href="mailto:soporte@urnight.pe">soporte@urnight.pe</a>
        </CardContent>
      </Card>
    </div>
  );
}
