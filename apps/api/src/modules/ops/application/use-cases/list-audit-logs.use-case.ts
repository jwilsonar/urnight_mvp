import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRecord,
  type AuditLogRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso (super_admin): últimos registros de auditoría (#23). */
@Injectable()
export class ListAuditLogsUseCase {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogs: AuditLogRepository) {}

  execute(input: { limit: number }): Promise<AuditLogRecord[]> {
    return this.auditLogs.list(input.limit);
  }
}
