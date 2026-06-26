import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Report } from '../../domain/entities/report.entity';
import { ReportNotFoundError } from '../../domain/errors/trust.errors';
import { REPORT_REPOSITORY, type ReportRepository } from '../../domain/ports/report.repository';

/** Caso de uso: resolver un reporte (admin_local del recurso / super_admin). */
@Injectable()
export class ResolveReportUseCase {
  private readonly log = createLogger(ResolveReportUseCase.name);

  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: {
    reportId: string;
    resolvedBy: string;
    note: string;
    scope: TenantScope;
  }): Promise<Report> {
    const report = await this.reports.findById(input.reportId);
    if (!report) {
      this.log.warn({ reportId: input.reportId }, 'trust.report.not_found');
      throw new ReportNotFoundError();
    }
    // Aislamiento tenant: solo el dueño del local/evento reportado (o super_admin).
    const companyId = report.localId
      ? await this.tenant.companyIdForLocal(report.localId)
      : report.eventId
        ? await this.tenant.companyIdForEvent(report.eventId)
        : null;
    assertTenant(input.scope, companyId);
    report.resolve(input.resolvedBy, input.note);
    const resolved = await this.reports.update(report);
    this.log.info({ reportId: resolved.id, resolvedBy: input.resolvedBy }, 'trust.report.resolved');
    return resolved;
  }
}
