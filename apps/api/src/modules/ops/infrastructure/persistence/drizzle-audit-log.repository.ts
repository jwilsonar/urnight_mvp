import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { auditLog } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type {
  AuditLogEntry,
  AuditLogRecord,
  AuditLogRepository,
} from '../../domain/ports/ops.ports';

/** Adapter Drizzle del AUDIT_LOG (#23). Persiste acciones sensibles. */
@Injectable()
export class DrizzleAuditLogRepository implements AuditLogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.db.insert(auditLog).values({
      id: entry.id,
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      ipAddress: entry.ipAddress,
      deviceInfo: entry.deviceInfo,
    });
  }

  async list(limit: number): Promise<AuditLogRecord[]> {
    const rows = await this.db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      ipAddress: r.ipAddress,
      deviceInfo: r.deviceInfo,
      createdAt: r.createdAt,
    }));
  }
}
