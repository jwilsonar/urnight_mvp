'use client';

import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/error-messages';
import { handleSessionExpired, isSessionExpiredError } from '@/lib/auth/session-expiry';
import { SESSION_EXPIRED } from '@/lib/constants';

interface RunOptions<T> {
  successMessage?: string;
  onSuccess?: (result: T) => void;
}

/**
 * Encapsula el patrón de mutación basada en Server Action / fetcher con token:
 * obtiene el access token de la sesión, corta con toast si falta, ejecuta dentro
 * de `startTransition` y traduce los errores. Reemplaza el guard de token +
 * try/catch/toast antes copiado en ~8 componentes.
 */
export function useTokenAction() {
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();

  function run<T>(fn: (token: string) => Promise<T>, options?: RunOptions<T>): void {
    const token = session?.accessToken;
    if (!token) {
      toast.error(SESSION_EXPIRED);
      return;
    }
    startTransition(async () => {
      try {
        const result = await fn(token);
        if (options?.successMessage) toast.success(options.successMessage);
        options?.onSuccess?.(result);
      } catch (error) {
        // No pasa por React Query: manejar la sesión expirada aquí mismo.
        if (isSessionExpiredError(error)) {
          handleSessionExpired();
          return;
        }
        toast.error(getErrorMessage(error));
      }
    });
  }

  return { run, pending };
}
