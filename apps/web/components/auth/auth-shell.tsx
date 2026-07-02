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
            <div className="absolute inset-y-3 left-9 right-6 overflow-hidden rounded-2xl">
              <div className="un-img-ph absolute inset-0">
                <span>{heroLabel}</span>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.15),rgba(5,5,10,0.7))]" />
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
