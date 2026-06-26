import type { Report } from '../entities/report.entity';

export interface ReportRepository {
  create(report: Report): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  update(report: Report): Promise<Report>;
}

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');
