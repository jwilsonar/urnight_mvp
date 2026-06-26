import { z } from 'zod';

const localeSchema = z
  .string()
  .regex(/^[a-z]{2}-[A-Z]{2}$/, 'locale debe ser BCP-47 corto, p.ej. es-PE');

/** Actualización parcial de preferencias del usuario (§4.1 UserPreference). */
export const updatePreferenceSchema = z
  .object({
    acceptsMarketing: z.boolean(),
    acceptsReminders: z.boolean(),
    preferredLocale: localeSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar' });
export type UpdatePreferenceDto = z.infer<typeof updatePreferenceSchema>;

/** Preferencias como las devuelve la API. */
export const preferenceResponseSchema = z.object({
  onboardingCompleted: z.boolean(),
  acceptsMarketing: z.boolean(),
  acceptsReminders: z.boolean(),
  preferredLocale: z.string(),
});
export type PreferenceResponse = z.infer<typeof preferenceResponseSchema>;
