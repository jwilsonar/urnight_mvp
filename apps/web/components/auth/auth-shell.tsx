import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';

/**
 * Shell de auth del prototipo (AuthStandalone): logo arriba-izquierda,
 * panel hero lateral (solo desktop) con claim sobre imagen redondeada, y
 * columna de formulario centrada. Sin hero, centra una sola columna.
 */
export function AuthShell({
  hero,
  heroLabel = 'UrNight · Night life',
  children,
}: {
  hero?: ReactNode;
  heroLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Logo ya enlaza al home por sí mismo (evitar <a> anidado). */}
      <div className="px-5 py-5 sm:px-9">
        <Logo />
      </div>
      <div className="flex flex-1">
        {hero ? (
          <div className="relative hidden flex-1 items-center lg:flex">
            <div className="absolute inset-y-3 left-9 right-6 overflow-hidden rounded-2xl border border-accent-border/40">
              {/* Fondo atmosférico nocturno (CSS). Para usar fotografía real:
                  reemplazar este div por <Image src="/brand/auth-hero.jpg" fill
                  className="object-cover" /> manteniendo el scrim de abajo. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(160deg,#1a0f3d_0%,#0c0820_45%,#05050a_100%)]"
              />
              <div
                aria-hidden
                className="un-breathe absolute -left-24 top-1/4 size-96 rounded-full bg-[radial-gradient(circle,rgba(108,77,255,0.35),transparent_65%)] blur-2xl"
              />
              <div
                aria-hidden
                className="absolute -right-16 top-8 size-72 rounded-full bg-[radial-gradient(circle,rgba(184,168,255,0.22),transparent_65%)] blur-2xl"
              />
              <div
                aria-hidden
                className="absolute bottom-10 right-1/4 size-56 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12),transparent_65%)] blur-2xl"
              />
              <span className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/50">
                {heroLabel}
              </span>
              {/* Scrim: garantiza legibilidad del claim y los chips sobre
                  cualquier fondo (también cuando haya foto). */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.1)_0%,rgba(5,5,10,0.35)_55%,rgba(5,5,10,0.85)_100%)]" />
            </div>
            <div className="relative max-w-md p-12 text-foreground">{hero}</div>
          </div>
        ) : null}
        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
