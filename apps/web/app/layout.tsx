import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'RAVENUE — Vida nocturna en Perú', template: '%s · RAVENUE' },
  description: 'Descubre locales y eventos de vida nocturna en Perú. Compra entradas, guarda favoritos y deja reseñas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <body className="min-h-dvh bg-root font-sans text-foreground antialiased">
        {/*
         * SessionProvider raíz SIN session: las páginas consumer (ISR,
         * revalidate) deben seguir siendo estáticas, así que la sesión se
         * resuelve en cliente. El subárbol de paneles re-hidrata con la sesión
         * del servidor en (panels)/layout.tsx para no depender de ese fetch.
         */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
