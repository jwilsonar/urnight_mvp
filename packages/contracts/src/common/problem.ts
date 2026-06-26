import { z } from 'zod';

/**
 * RFC 7807 / 9457 — Problem Details. La API emite errores con este shape
 * (Content-Type: application/problem+json). Los clientes lo parsean para UI.
 */
export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  /** Código de error de dominio machine-readable (extensión propia, p.ej. identity/underage). */
  code: z.string().optional(),
  /** Errores de validación por campo (extensión propia). */
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
