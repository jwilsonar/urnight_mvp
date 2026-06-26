import { Controller, Get, Query } from '@nestjs/common';
import type { AuditLogResponse } from '@urnight/contracts';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ListAuditLogsUseCase } from '../../application/use-cases/list-audit-logs.use-case';

/** Registro de auditoría (AUDIT_LOG §4.1, #23). /api/v1/audit-logs. Solo super_admin. */
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  @Roles('super_admin')
  @Get()
  async list(@Query('limit') limit?: string): Promise<AuditLogResponse[]> {
    const max = Math.min(Number(limit) || 100, 500);
    const rows = await this.listAuditLogs.execute({ limit: max });
    return rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      ipAddress: r.ipAddress,
      deviceInfo: r.deviceInfo,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
