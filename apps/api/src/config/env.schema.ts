import { z } from 'zod';

/** Esquema de variables de entorno (§6 secrets). SCREAMING_SNAKE_CASE (§2.3). */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    // Nivel de logging (pino, §6). Vacío => derivado del entorno en logger.ts.
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    // Secretos JWT: min 32 chars para HS256 (B5). Firmado/verificado con HS256 (algorithms allowlist).
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900), // 15 min (segundos)
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
    JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800), // 7 días (segundos)
    GOOGLE_CLIENT_ID: z.string().default(''), // vacío = login con Google deshabilitado
    // CORS (M6): allowlist de orígenes separados por coma. Dev por defecto = web local.
    // En prod debe definirse explícitamente; '' ⇒ ningún origen cross-site permitido.
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    // trust proxy de Express (A3): 'true'/'false', nº de saltos, o lista/subred.
    // '' ⇒ derivado del entorno en main.ts (prod=1, dev=false).
    TRUST_PROXY: z.string().default(''),
    // Object Storage S3 (§1.4 / §5). Defaults apuntan a LocalStack para dev local;
    // en producción son OBLIGATORIOS y no pueden quedar en 'test' (B5, ver superRefine).
    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().default('test'),
    AWS_SECRET_ACCESS_KEY: z.string().default('test'),
    AWS_ENDPOINT: z.string().default(''), // local: http://localhost:4566 · prod: '' (AWS real)
    S3_BUCKET: z.string().default('urnight-local'),
    S3_PUBLIC_URL: z.string().default(''), // base CDN/pública del catálogo. '' = derivar del endpoint
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    // En producción, las credenciales AWS reales son obligatorias (no 'test').
    for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const) {
      const value = env[key];
      if (!value || value === 'test') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} es obligatorio en producción (no puede quedar en el default 'test').`,
        });
      }
    }
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
