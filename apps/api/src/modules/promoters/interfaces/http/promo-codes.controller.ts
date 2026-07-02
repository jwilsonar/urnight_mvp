import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  createPromoCodeSchema,
  validatePromoCodeSchema,
  type CreatePromoCodeDto,
  type PromoCodeResponse,
  type PromoRedemptionResponse,
  type PromoValidationResponse,
  type ValidatePromoCodeDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { tenantScopeOf } from '../../../../edge/tenant/tenant-scope.helper';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreatePromoCodeUseCase } from '../../application/use-cases/create-promo-code.use-case';
import { ListPromoCodeRedemptionsUseCase } from '../../application/use-cases/list-promo-code-redemptions.use-case';
import { ValidatePromoCodeUseCase } from '../../application/use-cases/validate-promo-code.use-case';
import type { PromoCode } from '../../domain/entities/promo-code.entity';
import { toRedemptionResponse } from './redemptions.controller';

/** Códigos promocionales (futuro: manuales con valor de descuento). /api/v1/promo-codes. */
@Controller('promo-codes')
export class PromoCodesController {
  constructor(
    private readonly createPromoCode: CreatePromoCodeUseCase,
    private readonly validatePromoCode: ValidatePromoCodeUseCase,
    private readonly listRedemptions: ListPromoCodeRedemptionsUseCase,
  ) {}

  @Roles('admin_local')
  @Get(':id/redemptions')
  async redemptions(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromoRedemptionResponse[]> {
    return (
      await this.listRedemptions.execute({ promoCodeId: id, scope: tenantScopeOf(actor) })
    ).map(toRedemptionResponse);
  }

  @Roles('admin_local')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(createPromoCodeSchema)) dto: CreatePromoCodeDto,
  ): Promise<PromoCodeResponse> {
    return toResponse(await this.createPromoCode.execute({ dto, scope: tenantScopeOf(actor) }));
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(
    @Body(new ZodValidationPipe(validatePromoCodeSchema)) dto: ValidatePromoCodeDto,
  ): Promise<PromoValidationResponse> {
    return this.validatePromoCode.execute(dto);
  }
}

function toResponse(p: PromoCode): PromoCodeResponse {
  return {
    id: p.id,
    code: p.code,
    discountType: p.discountType,
    discountValue: p.discountValue,
    scope: p.scope,
    usageQuota: p.usageQuota,
    usedCount: p.usedCount,
    isActive: p.isActive,
  };
}
