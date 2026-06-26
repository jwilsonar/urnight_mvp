import type { Report } from '../../../../modules/trust/domain/entities/report.entity';
import type { ReportRepository } from '../../../../modules/trust/domain/ports/report.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** ReportRepository en memoria. Replica el adapter Drizzle (create/findById/update). */
export class InMemoryReportRepository
  extends InMemoryRepository<Report>
  implements ReportRepository
{
  /** Precarga un reporte sin pasar por `create` (datos de prueba). */
  seed(report: Report): this {
    this.put(report);
    return this;
  }

  async create(report: Report): Promise<Report> {
    this.put(report);
    return report;
  }

  async findById(id: string): Promise<Report | null> {
    return this.getById(id);
  }

  async update(report: Report): Promise<Report> {
    this.put(report);
    return report;
  }
}
