import type { CreateReportDto } from '@urnight/contracts';
import type { Report } from '../../../../modules/trust/domain/entities/report.entity';
import { ReportBuilder } from '../../builders/trust/report.builder';

/** Casos predefinidos de Report y DTOs de entrada para los casos de uso. */
export const ReportMother = {
  /** Reporte abierto de un local (severidad baja). */
  openLocal: (localId = 'local-1'): Report =>
    new ReportBuilder().forLocal(localId).withStatus('open').build(),

  /** Reporte abierto de un evento (severidad alta). */
  openEventHighSeverity: (eventId = 'event-1'): Report =>
    new ReportBuilder().forEvent(eventId).withSeverity('high').withStatus('open').build(),

  /** Reporte ya resuelto. */
  resolved: (localId = 'local-1'): Report =>
    new ReportBuilder().forLocal(localId).asResolved('admin-1', 'Resuelto en prueba').build(),

  /** DTO válido para reportar un local. */
  createLocalDto: (overrides: Partial<CreateReportDto> = {}): CreateReportDto => ({
    targetType: 'local',
    localId: 'local-1',
    reason: 'unsafe',
    severity: 'low',
    ...overrides,
  }),

  /** DTO válido para reportar un evento. */
  createEventDto: (overrides: Partial<CreateReportDto> = {}): CreateReportDto => ({
    targetType: 'event',
    eventId: 'event-1',
    reason: 'cancelled',
    severity: 'high',
    ...overrides,
  }),
};
