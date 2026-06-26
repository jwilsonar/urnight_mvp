import { describe, expect, it } from 'vitest';
import { Report } from './report.entity';
import { ReportBuilder } from '../../../../shared/testing/builders/trust';
import { ReportMother } from '../../../../shared/testing/mothers/trust';

describe('Report (aggregate reporte §4.1)', () => {
  it('file() inicializa un reporte abierto, sin resolución, para un local', () => {
    const report = Report.file({
      id: 'rep-1',
      reporterUserId: 'user-1',
      targetType: 'local',
      localId: 'local-1',
      eventId: null,
      reason: 'unsafe',
      comment: 'Peligroso',
      severity: 'high',
    });

    expect(report.id).toBe('rep-1');
    expect(report.reporterUserId).toBe('user-1');
    expect(report.targetType).toBe('local');
    expect(report.localId).toBe('local-1');
    expect(report.eventId).toBeNull();
    expect(report.reason).toBe('unsafe');
    expect(report.comment).toBe('Peligroso');
    expect(report.severity).toBe('high');
    expect(report.status).toBe('open');
    expect(report.resolutionNote).toBeNull();
    expect(report.resolvedBy).toBeNull();
    expect(report.createdAt).toBeInstanceOf(Date);
  });

  it('file() permite reportes anónimos (reporterUserId null) y aplica defaults', () => {
    const report = Report.file({
      id: 'rep-2',
      reporterUserId: null,
      targetType: 'event',
      eventId: 'event-1',
      reason: 'cancelled',
      severity: 'low',
    });

    expect(report.reporterUserId).toBeNull();
    expect(report.targetType).toBe('event');
    expect(report.eventId).toBe('event-1');
    expect(report.localId).toBeNull();
    expect(report.comment).toBeNull();
    expect(report.status).toBe('open');
  });

  it('preserva la severidad indicada (low | medium | high)', () => {
    expect(new ReportBuilder().withSeverity('low').build().severity).toBe('low');
    expect(new ReportBuilder().withSeverity('medium').build().severity).toBe('medium');
    expect(new ReportBuilder().withSeverity('high').build().severity).toBe('high');
  });

  it('resolve() marca resuelto, fija resolvedBy/nota y sella resolvedAt', () => {
    const report = ReportMother.openLocal('local-1');
    expect(report.status).toBe('open');

    report.resolve('admin-9', 'Verificado y cerrado');

    expect(report.status).toBe('resolved');
    expect(report.resolvedBy).toBe('admin-9');
    expect(report.resolutionNote).toBe('Verificado y cerrado');
  });

  it('fromPersistence() rehidrata un reporte ya resuelto sin alterarlo', () => {
    const createdAt = new Date('2026-02-01T00:00:00Z');
    const resolvedAt = new Date('2026-02-02T00:00:00Z');
    const report = Report.fromPersistence({
      id: 'rep-3',
      reporterUserId: 'user-3',
      targetType: 'local',
      localId: 'local-3',
      eventId: null,
      reason: 'wrong_price',
      comment: null,
      severity: 'medium',
      status: 'resolved',
      resolutionNote: 'Listo',
      resolvedBy: 'admin-3',
      createdAt,
      resolvedAt,
    });

    expect(report.status).toBe('resolved');
    expect(report.resolvedBy).toBe('admin-3');
    expect(report.resolutionNote).toBe('Listo');
    expect(report.createdAt).toBe(createdAt);
  });
});
