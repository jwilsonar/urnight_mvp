import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ProblemDetails } from '@urnight/contracts';
import type { Request, Response } from 'express';
import { DomainError } from '../../shared/errors/domain-error';
import { createLogger } from '../../shared/logging/logger';
import { ZodValidationException } from '../pipes/zod-validation.pipe';

/**
 * Error Handler del edge (§2.2). Normaliza TODA excepción a
 * `application/problem+json` (RFC 7807/9457).
 */
@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly log = createLogger(ProblemJsonFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    const problem = this.toProblem(exception, req.url);

    // 5xx => error con stack (fallo inesperado). 4xx de dominio => debug
    // (esperado: regla de negocio); el log HTTP de pino ya lo marca warn.
    if (problem.status >= 500) {
      this.log.error(
        { err: exception, method: req.method, path: req.url, status: problem.status, reqId: req.id },
        'http.error.unhandled',
      );
    } else {
      this.log.debug(
        { method: req.method, path: req.url, status: problem.status, code: problem.code, reqId: req.id },
        'http.error.handled',
      );
    }

    res.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    if (exception instanceof ZodValidationException) {
      const flat = exception.zodError.flatten();
      return {
        type: 'about:blank',
        title: 'Unprocessable Entity',
        status: 422,
        detail: 'La validación del payload falló.',
        instance,
        errors: flat.fieldErrors as Record<string, string[]>,
      };
    }

    if (exception instanceof DomainError) {
      return {
        type: exception.code,
        title: exception.name,
        status: exception.status,
        detail: exception.message,
        instance,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const detail =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message?.toString() ??
            exception.message);
      return {
        type: 'about:blank',
        title: exception.name.replace(/Exception$/, ''),
        status,
        detail,
        instance,
      };
    }

    // Violaciones de constraint de Postgres (postgres.js) → Problem+JSON de dominio (B1).
    // Mensajes genéricos y seguros: no se filtran constraint/tabla/columna internos.
    const pgCode = pgErrorCode(exception);
    if (pgCode === '23505') {
      return {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'El recurso ya existe o viola una restricción de unicidad.',
        instance,
        code: 'persistence/unique_violation',
      };
    }
    if (pgCode === '23514') {
      return {
        type: 'about:blank',
        title: 'Unprocessable Entity',
        status: 422,
        detail: 'La operación viola una regla de negocio.',
        instance,
        code: 'persistence/check_violation',
      };
    }

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Ocurrió un error inesperado.',
      instance,
    };
  }
}

/**
 * Extrae el SQLSTATE (p.ej. '23505') de un error de postgres.js, recorriendo la
 * cadena `cause` por si drizzle lo envuelve. `null` si no es un error PG.
 */
function pgErrorCode(exception: unknown): string | null {
  let current: unknown = exception;
  for (let depth = 0; depth < 5 && current != null; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}
