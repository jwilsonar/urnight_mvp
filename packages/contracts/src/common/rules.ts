import { z } from 'zod';

/** Edad mínima legal del MVP (§4.3 — solo mayores de 18). */
export const MIN_AGE = 18;

/** Calcula la edad en años a partir de una fecha de nacimiento. */
export function ageFrom(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

/**
 * Fecha de nacimiento válida solo si la persona es mayor de 18 (§4.3).
 * Reutilizable en registro (web/móvil) y checkout (API) — un solo esquema.
 */
export const adultBirthDateSchema = z
  .string()
  .date()
  .refine((value) => ageFrom(new Date(value)) >= MIN_AGE, {
    message: `Debe ser mayor de ${MIN_AGE} años`,
  });

/** Número de documento: 8–20 alfanumérico (DNI/CE/Pasaporte). */
export const documentNumberSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^[A-Za-z0-9]+$/, 'Documento inválido');
