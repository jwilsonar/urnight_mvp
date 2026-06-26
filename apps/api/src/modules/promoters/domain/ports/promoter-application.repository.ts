import type { PromoterApplication } from '../entities/promoter-application.entity';

export interface PromoterApplicationRepository {
  create(application: PromoterApplication): Promise<PromoterApplication>;
  findById(id: string): Promise<PromoterApplication | null>;
  update(application: PromoterApplication, tx?: unknown): Promise<PromoterApplication>;
}

export const PROMOTER_APPLICATION_REPOSITORY = Symbol('PROMOTER_APPLICATION_REPOSITORY');
