import { describe, expect, it } from 'vitest';
import { InMemoryReportRepository } from '../../../../shared/testing/in-memory/trust';
import { ReportMother } from '../../../../shared/testing/mothers/trust';
import { CreateReportUseCase } from './create-report.use-case';

function build() {
  const reports = new InMemoryReportRepository();
  const useCase = new CreateReportUseCase(reports);
  return { reports, useCase };
}

describe('CreateReportUseCase', () => {
  it('crea un reporte abierto de un local con la severidad indicada', async () => {
    const { useCase } = build();

    const report = await useCase.execute({
      reporterUserId: 'user-1',
      dto: ReportMother.createLocalDto({ localId: 'local-1', reason: 'unsafe', severity: 'high' }),
    });

    expect(report.targetType).toBe('local');
    expect(report.localId).toBe('local-1');
    expect(report.eventId).toBeNull();
    expect(report.reporterUserId).toBe('user-1');
    expect(report.reason).toBe('unsafe');
    expect(report.severity).toBe('high');
    expect(report.status).toBe('open');
  });

  it('persiste el reporte en el repositorio (estado)', async () => {
    const { reports, useCase } = build();

    const report = await useCase.execute({
      reporterUserId: 'user-1',
      dto: ReportMother.createLocalDto(),
    });

    expect(reports.size).toBe(1);
    expect(reports.all[0]?.id).toBe(report.id);
  });

  it('admite reportes anónimos (reporterUserId null)', async () => {
    const { useCase } = build();

    const report = await useCase.execute({
      reporterUserId: null,
      dto: ReportMother.createEventDto(),
    });

    expect(report.reporterUserId).toBeNull();
    expect(report.targetType).toBe('event');
    expect(report.eventId).toBe('event-1');
    expect(report.localId).toBeNull();
  });
});
