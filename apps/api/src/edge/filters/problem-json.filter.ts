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

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Ocurrió un error inesperado.',
      instance,
    };
  }
}
