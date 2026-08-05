import { z } from 'zod';
import { createLogger } from '../logger';

const log = createLogger('env');

/** Placeholders/valores conocidos débiles que jamás deben firmar sesiones en prod. */
const WEAK_SECRETS = new Set([
  'ravenue-secret',
  'change-me-web-session-secret-min-32-chars',
]);

const MIN_SECRET_LENGTH = 32;

function isWeakSecret(secret: string): boolean {
  return secret.length < MIN_SECRET_LENGTH || WEAK_SECRETS.has(secret);
}

/**
 * Esquema de variables de entorno de la web (espejo del patrón de
 * apps/api/src/config/env.schema.ts). Se valida al arrancar el server vía
 * instrumentation.ts: en producción un AUTH_SECRET débil impide el boot
 * (firma la cookie de sesión de NextAuth — si es forjable, la auth entera cae).
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AUTH_SECRET: z
      .string()
      .min(1, 'AUTH_SECRET es obligatorio (genera uno: openssl rand -base64 32)'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3101/api/v1'),
    NEXT_PUBLIC_STORAGE_URL: z.string().url().default('http://localhost:4566'),
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (isWeakSecret(env.AUTH_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_SECRET'],
        message: `AUTH_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres y no ser un placeholder (genera uno: openssl rand -base64 32).`,
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Validación de arranque — falla rápido si la config es inválida. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(`Configuración de entorno inválida (web):\n${issues}`);
  }
  const env = parsed.data;
  // En dev no bloquea el arranque, pero avisa: el mismo secreto en prod es fatal.
  if (env.NODE_ENV !== 'production' && isWeakSecret(env.AUTH_SECRET)) {
    log.warn({}, 'web.env.weak_auth_secret');
  }
  return env;
}
