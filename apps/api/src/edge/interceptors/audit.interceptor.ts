import { randomUUID } from 'node:crypto';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, Optional, type NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { tap } from 'rxjs';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from '../../modules/ops/domain/ports/ops.ports';
import { createLogger } from '../../shared/logging/logger';

type AuditRequest = Request & { user?: { id?: string }; id?: string };

/**
 * Audit Interceptor (§2.2). Fase 1: registra acción (controlador.handler),
 * actor y latencia de forma estructurada. La persistencia before/after en
 * AUDIT_LOG llega con el módulo Ops; este log es la semilla de esa traza.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly log = createLogger(AuditInterceptor.name);

  constructor(
    @Optional()
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogs?: AuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<AuditRequest>();
    const action = context.getHandler().name;
    const entityType = context.getClass().name;
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.log.debug(
          {
            action: `${entityType}.${action}`,
            method: req.method,
            path: req.url,
            userId: req.user?.id,
            reqId: req.id,
            ms: Date.now() - start,
          },
          'audit.action',
        );
        // Persiste solo mutaciones exitosas en AUDIT_LOG (#23) — no floodea con GET.
        if (req.method !== 'GET' && this.auditLogs) {
          const rawId = req.params?.id;
          const entityId =
            typeof rawId === 'string' && /^[0-9a-f-]{36}$/i.test(rawId) ? rawId : null;
          void this.auditLogs
            .record({
              id: randomUUID(),
              actorUserId: req.user?.id ?? null,
              action: action.slice(0, 40),
              entityType: entityType.slice(0, 60),
              entityId,
              ipAddress: req.ip ?? null,
              deviceInfo: (req.headers['user-agent'] ?? '').toString().slice(0, 255) || null,
            })
            .catch((err) => this.log.error({ err }, 'audit.persist_failed'));
        }
      }),
    );
  }
}
