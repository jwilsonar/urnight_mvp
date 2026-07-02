import type { ReactNode } from 'react';

/** Layout de autenticación: tarjeta centrada, sin cabecera del sitio. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    /* Fondo con el wash amatista del DS; el AuthShell de cada página define
       la estructura (split hero + formulario, como el prototipo). */
    <main className="un-hero-glow min-h-dvh" data-area="auth">
      {children}
    </main>
  );
}
