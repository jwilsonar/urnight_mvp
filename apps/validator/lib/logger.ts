/**
 * Logger ligero de la app de Validación (Expo / React Native). `pino` no corre
 * bien en RN, así que envolvemos `console` manteniendo la misma firma
 * `(fields, msg)` que el resto del monorepo (§6). Crítico aquí: NUNCA loguear el
 * contenido del QR ni números de documento — solo metadatos del check-in.
 */

type Level = 'error' | 'warn' | 'info' | 'debug';
type Fields = Record<string, unknown>;

const APP = 'urnight-validator';
const ORDER: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };

const isDev = process.env.NODE_ENV !== 'production';
const configured = process.env.EXPO_PUBLIC_LOG_LEVEL as Level | 'silent' | undefined;
const threshold = configured === 'silent' ? -1 : ORDER[configured ?? (isDev ? 'debug' : 'info')];

const SECRET_KEYS = new Set([
  'token',
  'accessToken',
  'refreshToken',
  'qrCode',
  'qr_code',
  'documentNumber',
  'document_number',
]);

function redact(fields: Fields): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = SECRET_KEYS.has(key) ? '[redacted]' : value;
  }
  return out;
}

function emit(level: Level, fields: Fields, msg: string, context?: string): void {
  if (ORDER[level] > threshold) return;
  const tag = context ? `[${APP}:${context}] ${msg}` : `[${APP}] ${msg}`;
  const safe = redact(fields);
  if (level === 'error') console.error(tag, safe);
  else if (level === 'warn') console.warn(tag, safe);
  else if (level === 'info') console.info(tag, safe);
  else console.log(tag, safe);
}

export interface Logger {
  error(fields: Fields, msg: string): void;
  warn(fields: Fields, msg: string): void;
  info(fields: Fields, msg: string): void;
  debug(fields: Fields, msg: string): void;
}

function make(context?: string): Logger {
  return {
    error: (f, m) => emit('error', f, m, context),
    warn: (f, m) => emit('warn', f, m, context),
    info: (f, m) => emit('info', f, m, context),
    debug: (f, m) => emit('debug', f, m, context),
  };
}

export const logger: Logger = make();

export function createLogger(context: string): Logger {
  return make(context);
}
