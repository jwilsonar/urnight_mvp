import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Button, Card } from '@urnight/ui';
import { BADGES_DEMO, NIVEL_DEMO } from '@/lib/mock/fidelizacion';

export const metadata: Metadata = {
  title: 'Niveles y badges',
  description: 'Sube de nivel acumulando puntos. Cada nivel desbloquea perks.',
};

/** Pantalla 37 del prototipo. Demo frontend-only (sin backend de puntos). */
export default function NivelesPage() {
  const unlocked = BADGES_DEMO.filter((b) => b.unlocked).length;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">Tu nivel UrNight</h2>
          <p className="text-sm text-muted-foreground">
            Sube de nivel acumulando puntos. Cada nivel desbloquea perks.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de puntos</Badge>
      </div>

      {/* Card de nivel con gradiente dorado→amatista del prototipo */}
      <div className="rounded-xl border border-warning-border bg-[linear-gradient(135deg,var(--warning-soft),var(--accent-soft))] p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffd700,#f59e0b)] text-4xl shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            🥇
          </div>
          <div className="min-w-0 flex-1">
            <p className="un-eyebrow text-warning">Nivel actual</p>
            <p className="font-heading text-2xl font-black sm:text-3xl">
              {NIVEL_DEMO.actual} · {NIVEL_DEMO.puntos.toLocaleString('es-PE')} pts
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Próximo nivel:{' '}
              <strong className="text-foreground">
                {NIVEL_DEMO.siguiente} · {NIVEL_DEMO.puntosSiguiente.toLocaleString('es-PE')} pts
              </strong>{' '}
              · te faltan {NIVEL_DEMO.puntosSiguiente - NIVEL_DEMO.puntos}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ffd700,var(--color-primary))]"
                style={{ width: `${NIVEL_DEMO.progresoPct}%` }}
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <Button variant="secondary" asChild>
              <Link href="/account/puntos#historial">Ver historial</Link>
            </Button>
            <Button asChild>
              <Link href="/account/puntos#canjear">Canjear puntos</Link>
            </Button>
          </div>
        </div>
      </div>

      <h3 className="mb-4 mt-7 text-[15px] font-bold">
        Tus badges{' '}
        <span className="font-medium text-muted-foreground">
          · {unlocked} de {BADGES_DEMO.length} desbloqueados
        </span>
      </h3>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
        {BADGES_DEMO.map((b) => (
          <Card
            key={b.nombre}
            className={`p-4 text-center ${b.unlocked ? '' : 'opacity-40 grayscale'}`}
          >
            <p className="text-3xl">{b.icono}</p>
            <p className="mt-2 text-[13px] font-bold leading-tight">{b.nombre}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.sub}</p>
            {!b.unlocked ? (
              <p className="un-eyebrow mt-2 !text-muted-foreground">🔒 Bloqueado</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
