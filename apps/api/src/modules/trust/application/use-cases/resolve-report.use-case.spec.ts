import { describe, expect, it } from 'vitest';
import { InMemoryReportRepository } from '../../../../shared/testing/in-memory/trust';
import { ReportBuilder } from '../../../../shared/testing/builders/trust';
import { FakeResourceTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { ReportMother } from '../../../../shared/testing/mothers/trust';
import { ReportNotFoundError } from '../../domain/errors/trust.errors';
import { ResolveReportUseCase } from './resolve-report.use-case';

function build() {
  const reports = new InMemoryReportRepository();
  const useCase = new ResolveReportUseCase(reports, new FakeResourceTenant());
  return { reports, useCase };
}

describe('ResolveReportUseCase', () => {
  it('resuelve un reporte abierto: status resolved + resolvedBy + nota', async () => {
    const { reports, useCase } = build();
    reports.seed(new ReportBuilder().withId('rep-1').withStatus('open').build());

    const result = await useCase.execute({
      reportId: 'rep-1',
      resolvedBy: 'admin-1',
      note: 'Caso verificado',
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.status).toBe('resolved');
    expect(result.resolvedBy).toBe('admin-1');
    expect(result.resolutionNote).toBe('Caso verificado');
  });

  it('persiste el cambio en el repositorio (estado)', async () => {
    const { reports, useCase } = build();
    reports.seed(ReportMother.openLocal('local-1'));
    const target = reports.all[0];

    await useCase.execute({
      reportId: target?.id ?? '',
      resolvedBy: 'admin-2',
      note: 'Cerrado',
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(reports.all[0]?.status).toBe('resolved');
    expect(reports.all[0]?.resolvedBy).toBe('admin-2');
  });

  it('reporte inexistente → ReportNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({
        reportId: 'ghost',
        resolvedBy: 'admin',
        note: 'x',
        scope: SUPER_ADMIN_SCOPE,
      }),
    ).rejects.toBeInstanceOf(ReportNotFoundError);
  });
});
