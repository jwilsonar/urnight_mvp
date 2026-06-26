import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { genReqId, rootLogger } from './logger';

/** Request enriquecido por el AuthGuard con la identidad resuelta (req.user). */
interface ReqWithUser extends IncomingMessage {
  user?: { id?: string; roles?: string[]; companyId?: string | null; localId?: string | null };
}

/**
 * Config del logger HTTP (nestjs-pino) montada sobre la instancia pino raíz.
 * Añade correlación (request id), props de actor (userId/roles) y mapeo de
 * nivel por status. Ignora health checks y la UI de OpenAPI para no ensuciar.
 */
export function buildPinoOptions(): Params {
  return {
    pinoHttp: {
      // Reutiliza la instancia raíz: misma config (nivel, redact, transporte).
      logger: rootLogger,
      genReqId,
      autoLogging: {
        ignore: (req: IncomingMessage) => {
          const url = req.url ?? '';
          return url.includes('/health') || url.includes('/docs');
        },
      },
      // Correlación de actor: disponible al cerrar la request (AuthGuard ya corrió).
      customProps: (req: IncomingMessage) => {
        const user = (req as ReqWithUser).user;
        return user?.id ? { userId: user.id, roles: user.roles ?? [] } : {};
      },
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
        `${req.method ?? 'REQ'} ${req.url ?? ''} → ${res.statusCode}`,
      customErrorMessage: (req: IncomingMessage, res: ServerResponse) =>
        `${req.method ?? 'REQ'} ${req.url ?? ''} → ${res.statusCode}`,
    },
  };
}
