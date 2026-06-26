'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { StorageProvider } from '@/lib/storage/storage-context';

/**
 * Providers de cliente: sesión (NextAuth), tema (next-themes), caché (TanStack
 * Query) y toasts. `session` opcional: en la raíz se omite (consumer = ISR, la
 * sesión se resuelve en cliente); el subárbol de paneles la pasa ya hidratada
 * desde el servidor para que `useSession()` esté `authenticated` en el primer
 * render — sin esto, las queries gateadas por `status==='authenticated'` /
 * `accessToken` quedan deshabilitadas hasta resolver `/api/auth/session`.
 */
export function Providers({ session, children }: { session?: Session | null; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <StorageProvider>{children}</StorageProvider>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
