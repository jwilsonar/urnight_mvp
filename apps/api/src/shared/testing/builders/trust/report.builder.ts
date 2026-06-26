import { randomUUID } from 'node:crypto';
import {
  Report,
  type ReportProps,
  type ReportReason,
  type ReportSeverity,
  type ReportStatus,
  type TargetType,
} from '../../../../modules/trust/domain/entities/report.entity';

/** Builder fluido para el aggregate Report (delegando en `Report.fromPersistence`). */
export class ReportBuilder {
  private id: string = randomUUID();
  private reporterUserId: string | null = 'user-1';
  private targetType: TargetType = 'local';
  private localId: string | null = 'local-1';
  private eventId: string | null = null;
  private reason: ReportReason = 'other';
  private comment: string | null = null;
  private severity: ReportSeverity = 'low';
  private status: ReportStatus = 'open';
  private resolutionNote: string | null = null;
  private resolvedBy: string | null = null;
  private createdAt = new Date('2026-01-01T00:00:00Z');
  private resolvedAt: Date | null = null;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withReporterUserId(reporterUserId: string | null): this {
    this.reporterUserId = reporterUserId;
    return this;
  }

  /** Apunta el reporte a un local (target local, eventId = null). */
  forLocal(localId: string): this {
    this.targetType = 'local';
    this.localId = localId;
    this.eventId = null;
    return this;
  }

  /** Apunta el reporte a un evento (target event, localId = null). */
  forEvent(eventId: string): this {
    this.targetType = 'event';
    this.eventId = eventId;
    this.localId = null;
    return this;
  }

  withReason(reason: ReportReason): this {
    this.reason = reason;
    return this;
  }

  withComment(comment: string | null): this {
    this.comment = comment;
    return this;
  }

  withSeverity(severity: ReportSeverity): this {
    this.severity = severity;
    return this;
  }

  withStatus(status: ReportStatus): this {
    this.status = status;
    return this;
  }

  asResolved(resolvedBy: string, note: string): this {
    this.status = 'resolved';
    this.resolvedBy = resolvedBy;
    this.resolutionNote = note;
    this.resolvedAt = new Date('2026-01-02T00:00:00Z');
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): Report {
    const props: ReportProps = {
      id: this.id,
      reporterUserId: this.reporterUserId,
      targetType: this.targetType,
      localId: this.localId,
      eventId: this.eventId,
      reason: this.reason,
      comment: this.comment,
      severity: this.severity,
      status: this.status,
      resolutionNote: this.resolutionNote,
      resolvedBy: this.resolvedBy,
      createdAt: this.createdAt,
      resolvedAt: this.resolvedAt,
    };
    return Report.fromPersistence(props);
  }
}
