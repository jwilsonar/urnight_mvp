import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type PromoRedemptionRecord,
} from '../../domain/ports/promo-code.repository';

/**
 * Caso de uso (admin): canjes de un código promocional (#13). Aislado por tenant
 * (M5): resuelve el companyId dueño del código (event→local.company_id) y aplica
 * `assertTenant` — un admin_local NO puede leer canjes de otra empresa. Falla
 * CERRADO: si el adapter no resuelve la propiedad, deniega a todo no-super_admin.
 */
@Injectable()
export class ListPromoCodeRedemptionsUseCase {
  constructor(@Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository) {}

  async execute(input: {
    promoCodeId: string;
    scope: TenantScope;
  }): Promise<PromoRedemptionRecord[]> {
    const companyId = (await this.promoCodes.ownerCompanyId?.(input.promoCodeId)) ?? null;
    assertTenant(input.scope, companyId);
    return this.promoCodes.listRedemptionsByCode(input.promoCodeId);
  }
}
