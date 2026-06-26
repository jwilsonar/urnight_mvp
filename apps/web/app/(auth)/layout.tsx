import type { ReactNode } from 'react';

/** Layout de autenticación: tarjeta centrada, sin cabecera del sitio. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4" data-area="auth">
      {children}
    </main>
  );
}
