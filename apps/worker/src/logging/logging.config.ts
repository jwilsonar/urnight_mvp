import type { Params } from 'nestjs-pino';
import { rootLogger } from './logger';

/**
 * Config del logger de Nest (nestjs-pino) para el Worker. Standalone: no hay
 * servidor HTTP, así que solo reutilizamos la instancia pino raíz para que los
 * logs de framework y de jobs compartan stream y formato.
 */
export function buildPinoOptions(): Params {
  return {
    pinoHttp: {
      logger: rootLogger,
    },
  };
}
