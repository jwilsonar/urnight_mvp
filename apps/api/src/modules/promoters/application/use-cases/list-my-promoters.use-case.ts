import { Inject, Injectable } from '@nestjs/common';
import { scopedCompanyId, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Promoter } from '../../domain/entities/promoter.entity';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/**
 * Lectura admin: promotores de MI empresa. Aislado por tenant — nunca devuelve
 * promotores de otra empresa. super_admin ve todos.
 */
@Injectable()
export class ListMyPromotersUseCase {
  constructor(@Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository) {}

  execute(scope: TenantScope): Promise<Promoter[]> {
    const companyId = scopedCompanyId(scope);
    if (companyId === undefined) return Promise.resolve([]);
    return this.promoters.listByCompany(companyId);
  }
}
