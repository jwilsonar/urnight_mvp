import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

/* Tipografía del DS: Inter para toda la UI y headings (400–800);
   Sora reservada a titulares hero/marketing (600–800). */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-sora', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'UrNight — Vida nocturna en Perú', template: '%s · UrNight' },
  description: 'Descubre locales y eventos de vida nocturna en Perú. Compra entradas, guarda favoritos y deja reseñas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
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
