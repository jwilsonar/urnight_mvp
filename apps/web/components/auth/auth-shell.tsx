import type { CSSProperties, ReactNode } from 'react';
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
              {/* Collage de "flyers" a la derecha del panel: rellena el espacio
                  vacío y flota lento (lenguaje de movimiento del home, sin
                  cargar imágenes). aria-hidden: decorativo. Va detrás del scrim
                  y del claim, así que nunca compite con el texto. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                  className="un-float absolute right-10 top-14 h-44 w-32 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,#2a1a5c,#140d2e)] opacity-70 shadow-2xl"
                  style={{ '--drift-rot': '6deg', '--drift-y': '-16px', '--drift-dur': '9s' } as CSSProperties}
                />
                <div
                  className="un-float absolute right-32 top-40 h-40 w-28 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,#3a2170,#1a1030)] opacity-60 shadow-2xl"
                  style={{ '--drift-rot': '-8deg', '--drift-y': '12px', '--drift-dur': '11s' } as CSSProperties}
                />
                <div
                  className="un-float absolute bottom-16 right-16 h-36 w-52 rounded-2xl border border-warning-border/30 bg-[linear-gradient(150deg,#4a2f14,#1a1030)] opacity-50 shadow-2xl"
                  style={{ '--drift-rot': '3deg', '--drift-y': '-10px', '--drift-dur': '13s' } as CSSProperties}
                />
              </div>
              <span className="absolute right-4 top-4 z-10 rounded-md border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/50">
                {heroLabel}
              </span>
              {/* Scrim: garantiza legibilidad del claim y los chips sobre
                  cualquier fondo (también cuando haya foto o el collage). */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.1)_0%,rgba(5,5,10,0.35)_55%,rgba(5,5,10,0.85)_100%)]" />
            </div>
            {/* z-10: por encima del collage y el scrim. La sombra de texto
                asegura contraste del claim sobre el fondo animado. */}
            <div className="relative z-10 max-w-md p-12 text-foreground [text-shadow:0_1px_16px_rgba(0,0,0,0.55)]">
              {hero}
            </div>
          </div>
        ) : null}
        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
