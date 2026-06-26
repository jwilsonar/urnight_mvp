/**
 * Logger isomórfico de la Web (§6). Misma firma `(fields, msg)` que el logger
 * de la API para mantener una sola convención en todo el monorepo:
 *
 *   logger.warn({ status, code, path }, 'web.api.error');
 *
 * - En servidor (Server Components / Actions / route handlers): emite JSON.
 * - En cliente (browser): consola legible, respetando NEXT_PUBLIC_LOG_LEVEL.
 * - Redacta secretos por nombre de clave: los tokens/sesión NUNCA deben loguearse.
 */

type Level = 'error' | 'warn' | 'info' | 'debug';
type Fields = Record<string, unknown>;

const ORDER: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };

const isServer = typeof window === 'undefined';
const isProd = process.env.NODE_ENV === 'production';

// En cliente solo está disponible NEXT_PUBLIC_*; en servidor, ambas.
const configured = (process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL) as
  | Level
  | 'silent'
  | undefined;
const threshold = configured === 'silent' ? -1 : ORDER[configured ?? (isProd ? 'info' : 'debug')];

const SECRET_KEYS = new Set([
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'handoff',
  'password',
  'currentPassword',
  'newPassword',
  'authorization',
]);

/** Redacción superficial por nombre de clave (§6). */
function redact(fields: Fields): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = SECRET_KEYS.has(key) ? '[redacted]' : value;
  }
  return out;
}

function emit(level: Level, fields: Fields, msg: string, context?: string): void {
  if (ORDER[level] > threshold) return;
  const safe = redact(fields);
  if (isServer) {
    const record = {
      level,
      time: new Date().toISOString(),
      app: 'urnight-web',
      side: 'server',
      ...(context ? { context } : {}),
      ...safe,
      msg,
    };
    const line = JSON.stringify(record);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }
  // Cliente: legible, con campos como objeto aparte.
  const tag = context ? `[web:${context}] ${msg}` : `[web] ${msg}`;
  if (level === 'error') console.error(tag, safe);
  else if (level === 'warn') console.warn(tag, safe);
  else if (level === 'info') console.info(tag, safe);
  else console.debug(tag, safe);
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

/** Logger raíz. Para añadir contexto fijo: `const log = createLogger('auth')`. */
export const logger: Logger = make();

export function createLogger(context: string): Logger {
  return make(context);
}
