import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino, { type Logger } from 'pino';

/**
 * Logging estructurado (§1.1 / §6 Observabilidad). Una única instancia pino
 * raíz alimenta tanto el logger HTTP (nestjs-pino, vía `logging.config.ts`)
 * como los loggers de dominio (`createLogger`). Un solo stream, una sola config.
 *
 * Los loggers de dominio se crean SIN inyección de dependencias para no romper
 * la instanciación directa de casos de uso en los tests (`new UseCase(...)`).
 */

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

/** Nivel efectivo: LOG_LEVEL manda; si no, test=silent, prod=info, dev=debug. */
const level = process.env.LOG_LEVEL ?? (isTest ? 'silent' : isProd ? 'info' : 'debug');

/**
 * Rutas redactadas (§6 secrets / PII). NUNCA emitir credenciales, tokens, QR
 * ni números de documento — ni en headers ni en cuerpos. Cubre nivel raíz y un
 * nivel de anidación (`*.campo`) para payloads tipo `{ dto: { password } }`.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'handoff',
  'qrCode',
  'qr_code',
  'documentNumber',
  'document_number',
  '*.password',
  '*.currentPassword',
  '*.newPassword',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.idToken',
  '*.handoff',
  '*.qrCode',
  '*.qr_code',
  '*.documentNumber',
  '*.document_number',
];

/** Instancia pino raíz compartida por todo el proceso API. */
export const rootLogger: Logger = pino({
  level,
  base: { app: 'urnight-api', env: process.env.NODE_ENV ?? 'development' },
  redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  // En dev: pretty legible. En test/prod: JSON puro (sin worker de transporte).
  ...(isTest || isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }),
});

/**
 * Logger de dominio con contexto (= nombre de clase). Uso:
 *   private readonly log = createLogger(MyUseCase.name);
 *   this.log.info({ orderId, userId }, 'ticketing.order.paid');
 */
export function createLogger(context: string): Logger {
  return rootLogger.child({ context });
}

/** Genera o propaga un request id correlacionable (header `x-request-id`). */
export function genReqId(req: IncomingMessage, res: ServerResponse): string {
  const existing = req.headers['x-request-id'];
  const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
  res.setHeader('x-request-id', id);
  return id;
}
