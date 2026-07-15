import type { Metadata } from 'next';
import { Badge, Card } from '@urnight/ui';
import { FriendsDemo } from '@/components/account/friends-demo';
import { Reveal } from '@/components/shared/reveal';
import { AMIGOS_DEMO, SOLICITUDES_DEMO } from '@/lib/mock/social';

export const metadata: Metadata = { title: 'Amigos' };

export default function AmigosPage() {
  const eventosCompartidos = AMIGOS_DEMO.reduce(
    (total, amigo) => total + amigo.eventosJuntos,
    0,
  );

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Amigos</h1>
            <p className="text-sm text-muted-foreground">
              Encuentra a tu grupo y recuerda las noches que compartieron.
            </p>
          </div>
          <Badge variant="info">Demo — llega con el backend social</Badge>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total amigos', value: AMIGOS_DEMO.length },
          { label: 'Solicitudes pendientes', value: SOLICITUDES_DEMO.length },
          { label: 'Eventos compartidos', value: eventosCompartidos },
        ].map((kpi, index) => (
          <Reveal key={kpi.label} delay={60 + index * 60}>
            <Card className="p-5">
              <p className="un-eyebrow !text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums">
                {kpi.value}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={220}>
        <FriendsDemo />
      </Reveal>
    </div>
  );
}
