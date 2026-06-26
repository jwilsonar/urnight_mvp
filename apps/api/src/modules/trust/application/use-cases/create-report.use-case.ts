import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateReportDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Report } from '../../domain/entities/report.entity';
import { REPORT_REPOSITORY, type ReportRepository } from '../../domain/ports/report.repository';

/** Caso de uso: reportar un local/evento. */
@Injectable()
export class CreateReportUseCase {
  private readonly log = createLogger(CreateReportUseCase.name);

  constructor(@Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository) {}

  async execute(input: { reporterUserId: string | null; dto: CreateReportDto }): Promise<Report> {
    const report = Report.file({
      id: randomUUID(),
      reporterUserId: input.reporterUserId,
      targetType: input.dto.targetType,
      localId: input.dto.localId ?? null,
      eventId: input.dto.eventId ?? null,
      reason: input.dto.reason,
      comment: input.dto.comment ?? null,
      severity: input.dto.severity,
    });
    const created = await this.reports.create(report);
    this.log.info(
      { reportId: created.id, userId: input.reporterUserId ?? undefined },
      'trust.report.created',
    );
    return created;
  }
}
