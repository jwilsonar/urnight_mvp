import { z } from 'zod';

/** Esquema de variables de entorno (§6 secrets). SCREAMING_SNAKE_CASE (§2.3). */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    // Nivel de logging (pino, §6). Vacío/ausente => derivado del entorno en logger.ts.
    // El preprocess normaliza '' (variable declarada sin valor en .env) a undefined.
    LOG_LEVEL: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
    ),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    TICKET_HOLD_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    // Secretos JWT: min 32 chars para HS256 (B5). Firmado/verificado con HS256 (algorithms allowlist).
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900), // 15 min (segundos)
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
    JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800), // 7 días (segundos)
    // AES-256-GCM para secretos TOTP: 32 bytes codificados en Base64.
    MFA_ENCRYPTION_KEY: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().optional(),
    ),
    // Tolerancia del TOTP en pasos de 30 s hacia atrás y hacia adelante. ±2 pasos
    // absorbe la deriva normal de un reloj de escritorio; más que eso no se acepta
    // (solo se reporta como desfase) para no alargar la vida útil de un código.
    //
    // Si el reloj del servidor se desfasa más que esta ventana, la API responde
    // 'identity/mfa-clock-drift' con los segundos de desfase en vez de mentir con
    // "código inválido". En Windows se sincroniza con: w32tm /resync
    MFA_TOTP_WINDOW_STEPS: z.coerce.number().int().min(0).max(10).default(2),
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
    // Una clave presente pero mal formada se valida en todos los entornos: antes
    // solo reventaba en producción y en local dejaba el MFA a medias, fallando
    // recién al cifrar el secreto y sin decir por qué.
    const mfaKey = env.MFA_ENCRYPTION_KEY
      ? Buffer.from(env.MFA_ENCRYPTION_KEY, 'base64')
      : null;
    const mfaKeyRequired = env.NODE_ENV === 'production';
    if ((mfaKeyRequired || mfaKey) && mfaKey?.length !== 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MFA_ENCRYPTION_KEY'],
        message: 'MFA_ENCRYPTION_KEY debe contener 32 bytes codificados en Base64.',
      });
    }
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
