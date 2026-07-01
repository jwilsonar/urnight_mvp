import type { ReactNode } from 'react';

/** Layout de autenticación: tarjeta centrada, sin cabecera del sitio. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    /* Fondo con el wash amatista del DS (atmósfera, no neón). */
    <main className="un-hero-glow flex min-h-dvh items-center justify-center p-4" data-area="auth">
      {children}
    </main>
  );
}
