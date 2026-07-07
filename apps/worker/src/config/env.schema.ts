import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  // Object Storage S3 (§1.4 / §5). Mismos nombres/vars que la API (A5): el PDF de
  // entradas se sube a S3/LocalStack de verdad, no a un log. Defaults => LocalStack.
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().default('test'),
  AWS_ENDPOINT: z.string().default(''), // local: http://localhost:4566 · prod: '' (AWS real)
  S3_BUCKET: z.string().default('urnight-local'),
  S3_PUBLIC_URL: z.string().default(''), // base CDN/pública. '' = derivar del endpoint
  // Umbral de reintentos del relay outbox antes de marcar la fila 'failed' (A4):
  // evita el loop infinito de una fila envenenada que nunca logra encolarse.
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Config del worker inválida:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    );
  }
  return parsed.data;
}
