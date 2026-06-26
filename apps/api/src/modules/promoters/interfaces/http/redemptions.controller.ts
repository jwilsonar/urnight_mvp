import { Controller, Get } from '@nestjs/common';
import type { PromoRedemptionResponse } from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ListMyRedemptionsUseCase } from '../../application/use-cases/list-my-redemptions.use-case';
import type { PromoRedemptionRecord } from '../../domain/ports/promo-code.repository';

/** Canjes de códigos promocionales del usuario autenticado. /api/v1/me/redemptions. */
@Controller('me/redemptions')
export class RedemptionsController {
  constructor(private readonly listMine: ListMyRedemptionsUseCase) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<PromoRedemptionResponse[]> {
    return (await this.listMine.execute({ userId: user.id })).map(toRedemptionResponse);
  }
}

export function toRedemptionResponse(r: PromoRedemptionRecord): PromoRedemptionResponse {
  return {
    id: r.id,
    promoCodeId: r.promoCodeId,
    orderId: r.orderId,
    discountApplied: r.discountApplied,
    redeemedAt: r.redeemedAt.toISOString(),
  };
}
