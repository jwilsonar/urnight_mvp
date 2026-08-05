import type { ReactNode } from 'react';

/** Layout de autenticación: tarjeta centrada, sin cabecera del sitio. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    /* Fondo con el wash carmín del DS; el AuthShell de cada página define
       la estructura (split hero + formulario, como el prototipo). */
    <main className="rv-hero-glow min-h-dvh" data-area="auth">
      {children}
    </main>
  );
}
