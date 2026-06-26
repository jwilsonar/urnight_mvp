import { z } from 'zod';

/** Esquema de variables de entorno (§6 secrets). SCREAMING_SNAKE_CASE (§2.3). */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  // Nivel de logging (pino, §6). Vacío => derivado del entorno en logger.ts.
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900), // 15 min (segundos)
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres'),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800), // 7 días (segundos)
  GOOGLE_CLIENT_ID: z.string().default(''), // vacío = login con Google deshabilitado
  // Object Storage S3 (§1.4 / §5). Defaults apuntan a LocalStack para dev local.
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().default('test'),
  AWS_ENDPOINT: z.string().default(''), // local: http://localhost:4566 · prod: '' (AWS real)
  S3_BUCKET: z.string().default('urnight-local'),
  S3_PUBLIC_URL: z.string().default(''), // base CDN/pública del catálogo. '' = derivar del endpoint
});

export type Env = z.infer<typeof envSchema>;

/** Validación de arranque — falla rápido si la config es inválida. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(`Configuración de entorno inválida:\n${issues}`);
  }
  return parsed.data;
}
