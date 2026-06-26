import { Inject, Injectable } from '@nestjs/common';
import { scopedCompanyId, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Local } from '../../domain/entities/local.entity';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

/**
 * Lectura admin: locales de la empresa del actor (TODOS los estados, incluye
 * no públicos). Aislamiento multi-tenant — nunca devuelve locales de otra
 * empresa. super_admin ve todos.
 */
@Injectable()
export class ListMyLocalsUseCase {
  constructor(@Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository) {}

  execute(scope: TenantScope): Promise<Local[]> {
    const companyId = scopedCompanyId(scope);
    if (companyId === undefined) return Promise.resolve([]); // sin empresa → nada
    return this.locals.listOwned(companyId);
  }
}
