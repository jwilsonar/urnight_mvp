import type { Metadata } from 'next';
import { Public_Sans, Raleway } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'UrNight — Vida nocturna en Perú', template: '%s · UrNight' },
  description: 'Descubre locales y eventos de vida nocturna en Perú. Compra entradas, guarda favoritos y deja reseñas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning className={`${publicSans.variable} ${raleway.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
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
