import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  createReportSchema,
  resolveReportSchema,
  type CreateReportDto,
  type ReportResponse,
  type ResolveReportDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateReportUseCase } from '../../application/use-cases/create-report.use-case';
import { ResolveReportUseCase } from '../../application/use-cases/resolve-report.use-case';
import type { Report } from '../../domain/entities/report.entity';

/** Reportes. /api/v1/reports. Crear: autenticado. Resolver: admin_local/super_admin. */
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly createReport: CreateReportUseCase,
    private readonly resolveReport: ResolveReportUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createReportSchema)) dto: CreateReportDto,
  ): Promise<ReportResponse> {
    return toReportResponse(await this.createReport.execute({ reporterUserId: user.id, dto }));
  }

  @Roles('admin_local')
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(resolveReportSchema)) dto: ResolveReportDto,
  ): Promise<ReportResponse> {
    return toReportResponse(
      await this.resolveReport.execute({
        reportId: id,
        resolvedBy: actor.id,
        note: dto.resolutionNote,
        scope: tenantScopeOf(actor),
      }),
    );
  }
}

function toReportResponse(r: Report): ReportResponse {
  return {
    id: r.id,
    targetType: r.targetType,
    localId: r.localId,
    eventId: r.eventId,
    reason: r.reason,
    severity: r.severity,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}
