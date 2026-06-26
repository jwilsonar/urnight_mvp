import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreatePromoCodeDto } from '@urnight/contracts';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { PromoCode } from '../../domain/entities/promo-code.entity';
import { PromoCodeCodeTakenError } from '../../domain/errors/promoters.errors';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from '../../domain/ports/promo-code.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/** Caso de uso: crear código promocional (super_admin / admin_local del recurso). */
@Injectable()
export class CreatePromoCodeUseCase {
  private readonly log = createLogger(CreatePromoCodeUseCase.name);

  constructor(
    @Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository,
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
  ) {}

  async execute(input: { dto: CreatePromoCodeDto; scope: TenantScope }): Promise<PromoCode> {
    const dto = input.dto;
    await this.assertCanCreate(dto, input.scope);
    if (await this.promoCodes.existsByCode(dto.code)) {
      this.log.warn({ promoCodeId: dto.code }, 'promoters.promo_code.duplicate');
      throw new PromoCodeCodeTakenError();
    }
    const promoCode = PromoCode.create({
      id: randomUUID(),
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      usageQuota: dto.usageQuota ?? null,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      scope: dto.scope,
      eventId: dto.eventId ?? null,
      localId: dto.localId ?? null,
    });
    const created = await this.promoCodes.create(promoCode);
    this.log.info({ promoCodeId: created.id }, 'promoters.promo_code.created');
    return created;
  }

  /**
   * Aislamiento tenant: admin_local solo crea códigos sobre recursos de su
   * empresa. Los alcances no acotables a una empresa (global, zone) quedan
   * reservados a super_admin.
   */
  private async assertCanCreate(dto: CreatePromoCodeDto, scope: TenantScope): Promise<void> {
    if (scope.isSuperAdmin) return;
    switch (dto.scope) {
      case 'event':
        assertTenant(scope, dto.eventId ? await this.tenant.companyIdForEvent(dto.eventId) : null);
        return;
      case 'local':
        assertTenant(scope, dto.localId ? await this.tenant.companyIdForLocal(dto.localId) : null);
        return;
      case 'ticket_type':
        assertTenant(
          scope,
          dto.ticketTypeId ? await this.tenant.companyIdForTicketType(dto.ticketTypeId) : null,
        );
        return;
      case 'promoter': {
        const promoter = dto.promoterId ? await this.promoters.findById(dto.promoterId) : null;
        assertTenant(scope, promoter?.companyId ?? null);
        return;
      }
      default:
        // 'global' | 'zone': no acotables a una empresa → solo super_admin.
        throw new TenantForbiddenError();
    }
  }
}
