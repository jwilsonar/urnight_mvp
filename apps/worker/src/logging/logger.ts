import pino, { type Logger } from 'pino';

/**
 * Logging estructurado del Worker (§1.1 / §6). Mismo criterio que la API: una
 * instancia pino raíz compartida por nestjs-pino y por los loggers de dominio
 * (`createLogger`), creados sin DI para no acoplar a Nest ni romper tests.
 */

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const level = process.env.LOG_LEVEL?.trim() || (isTest ? 'silent' : isProd ? 'info' : 'debug');

/** Rutas redactadas (§6 secrets / PII). El worker procesa datos de órdenes/QR. */
export const REDACT_PATHS = [
  'qrCode',
  'qr_code',
  'documentNumber',
  'document_number',
  'token',
  'accessToken',
  'refreshToken',
  '*.qrCode',
  '*.qr_code',
  '*.documentNumber',
  '*.document_number',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
];

export const rootLogger: Logger = pino({
  level,
  base: { app: 'urnight-worker', env: process.env.NODE_ENV ?? 'development' },
  redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  ...(isTest || isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }),
});

/** Logger de dominio con contexto (= nombre de clase / procesador). */
export function createLogger(context: string): Logger {
  return rootLogger.child({ context });
}
