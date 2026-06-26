import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { report } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import {
  Report,
  type ReportReason,
  type ReportSeverity,
  type ReportStatus,
  type TargetType,
} from '../../domain/entities/report.entity';
import type { ReportRepository } from '../../domain/ports/report.repository';

type Row = typeof report.$inferSelect;

@Injectable()
export class DrizzleReportRepository implements ReportRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(entity: Report): Promise<Report> {
    const [row] = await this.db
      .insert(report)
      .values({
        id: entity.id,
        reporterUserId: entity.reporterUserId,
        targetType: entity.targetType,
        localId: entity.localId,
        eventId: entity.eventId,
        reason: entity.reason,
        comment: entity.comment,
        severity: entity.severity,
        status: entity.status,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el reporte');
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Report | null> {
    const [row] = await this.db.select().from(report).where(eq(report.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async update(entity: Report): Promise<Report> {
    const [row] = await this.db
      .update(report)
      .set({
        status: entity.status,
        resolutionNote: entity.resolutionNote,
        resolvedBy: entity.resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(report.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el reporte');
    return this.toDomain(row);
  }

  private toDomain(row: Row): Report {
    return Report.fromPersistence({
      id: row.id,
      reporterUserId: row.reporterUserId,
      targetType: row.targetType as TargetType,
      localId: row.localId,
      eventId: row.eventId,
      reason: row.reason as ReportReason,
      comment: row.comment,
      severity: row.severity as ReportSeverity,
      status: row.status as ReportStatus,
      resolutionNote: row.resolutionNote,
      resolvedBy: row.resolvedBy,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    });
  }
}
