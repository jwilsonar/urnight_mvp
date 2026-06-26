import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './client';

/**
 * Vuelca los `fieldErrors` (extensión RFC 7807 del backend) sobre el estado del
 * formulario para feedback inline. No-op si el error no es un `ApiError`.
 * Centraliza el bucle antes copiado en ~6 formularios.
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  err: unknown,
): void {
  if (!(err instanceof ApiError)) return;
  for (const [field, messages] of Object.entries(err.fieldErrors)) {
    setError(field as Path<T>, { message: messages[0] ?? 'Dato inválido' });
  }
}
