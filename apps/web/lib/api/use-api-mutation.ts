'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { FieldValues, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { isSessionExpiredError } from '@/lib/auth/session-expiry';
import { applyFieldErrors } from './apply-field-errors';
import { getErrorMessage } from './error-messages';

interface ApiMutationConfig<TData, TVars, TForm extends FieldValues> {
  /** Función de mutación (normalmente un fetcher de `lib/api`). */
  mutationFn: (vars: TVars) => Promise<TData>;
  /** `setError` del formulario: si se pasa, vuelca `fieldErrors` inline. */
  setError?: UseFormSetError<TForm>;
  /** Claves de query a invalidar tras el éxito (mantiene la caché fresca). */
  invalidateKeys?: readonly QueryKey[];
  /** Toast de éxito (string o derivado del resultado). */
  successMessage?: string | ((data: TData) => string);
  /** Callback adicional de éxito (navegación, reset, estado local). */
  onSuccess?: (data: TData, vars: TVars) => void;
}

/**
 * Envuelve `useMutation` con el comportamiento estándar del proyecto:
 * toast de error localizado, volcado de `fieldErrors` al formulario,
 * invalidación de caché e (opcional) toast de éxito. Unifica el trío
 * "mutación + fieldErrors + toast" antes duplicado en cada formulario.
 */
export function useApiMutation<TData, TVars, TForm extends FieldValues = FieldValues>(
  config: ApiMutationConfig<TData, TVars, TForm>,
): UseMutationResult<TData, unknown, TVars> {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVars>({
    mutationFn: config.mutationFn,
    onSuccess: (data, vars) => {
      if (config.successMessage) {
        toast.success(
          typeof config.successMessage === 'function'
            ? config.successMessage(data)
            : config.successMessage,
        );
      }
      config.invalidateKeys?.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
      config.onSuccess?.(data, vars);
    },
    onError: (err) => {
      // Sesión expirada: el interceptor global (providers.tsx) ya redirige a
      // login — un toast aquí solo duplicaría el aviso durante la navegación.
      if (isSessionExpiredError(err)) return;
      if (config.setError) applyFieldErrors(config.setError, err);
      toast.error(getErrorMessage(err));
    },
  });
}
