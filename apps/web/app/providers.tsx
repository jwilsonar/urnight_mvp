"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/motion/motion-provider";
import { NavigationScrollManager } from "@/components/shared/navigation-scroll-manager";
import {
  handleSessionExpired,
  isSessionExpiredError,
} from "@/lib/auth/session-expiry";
import { StorageProvider } from "@/lib/storage/storage-context";

/**
 * Providers de cliente: sesión (NextAuth), tema (next-themes), caché (TanStack
 * Query) y toasts. `session` opcional: en la raíz se omite (consumer = ISR, la
 * sesión se resuelve en cliente); el subárbol de paneles la pasa ya hidratada
 * desde el servidor para que `useSession()` esté `authenticated` en el primer
 * render — sin esto, las queries gateadas por `status==='authenticated'` /
 * `accessToken` quedan deshabilitadas hasta resolver `/api/auth/session`.
 */

/**
 * Interceptor global: un 401 en cualquier query/mutación significa sesión
 * inutilizable (token revocado o vencido sin refresh) → re-login una sola vez.
 * Vive en QueryCache/MutationCache para cubrir TODO el tráfico React Query sin
 * tocar cada componente.
 */
const onApiError = (err: unknown): void => {
  if (isSessionExpiredError(err)) handleSessionExpired();
};

/**
 * Cubre el caso que no dispara ningún request: cuando el refresh falla, la
 * sesión deja de entregar accessToken y las queries gateadas por `enabled`
 * se apagan sin emitir 401 — sin este watcher el usuario queda en una página
 * muerta en vez de volver a login.
 */
const ACTIVITY_SYNC_INTERVAL_MS = 60_000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
];

function SessionExpiryWatcher() {
  const { data: session, status, update } = useSession();
  const lastActivitySync = useRef(Date.now());

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") handleSessionExpired();
  }, [session?.error]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const recordActivity = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastActivitySync.current < ACTIVITY_SYNC_INTERVAL_MS) return;
      lastActivitySync.current = now;
      void update({ activity: true });
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS)
        window.removeEventListener(event, recordActivity);
    };
  }, [status, update]);

  useEffect(() => {
    if (!session?.expires) return;
    const expiresAt = Date.parse(session.expires);
    if (!Number.isFinite(expiresAt)) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      handleSessionExpired();
      return;
    }
    const timeout = window.setTimeout(handleSessionExpired, remaining);
    return () => window.clearTimeout(timeout);
  }, [session?.expires]);

  return null;
}

export function Providers({
  session,
  children,
}: {
  session?: Session | null;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: onApiError }),
        mutationCache: new MutationCache({ onError: onApiError }),
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <SessionExpiryWatcher />
      <NavigationScrollManager />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <StorageProvider>
            <MotionProvider>{children}</MotionProvider>
          </StorageProvider>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
