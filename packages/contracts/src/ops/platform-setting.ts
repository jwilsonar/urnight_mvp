import { z } from 'zod';

/** Crear/actualizar un ajuste de plataforma (super_admin). */
export const upsertPlatformSettingSchema = z.object({
  key: z.string().trim().min(2).max(80),
  value: z.string().max(2000),
  valueType: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
});
export type UpsertPlatformSettingDto = z.infer<typeof upsertPlatformSettingSchema>;

export const platformSettingResponseSchema = z.object({
  key: z.string(),
  value: z.string(),
  valueType: z.enum(['string', 'number', 'boolean', 'json']),
  updatedAt: z.string(),
});
export type PlatformSettingResponse = z.infer<typeof platformSettingResponseSchema>;
