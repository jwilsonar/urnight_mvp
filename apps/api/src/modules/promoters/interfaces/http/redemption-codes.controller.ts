import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { ResolveRedemptionCodeResponse } from '@urnight/contracts';
import { Public } from '../../../../edge/decorators/public.decorator';
import { RegisterRedemptionClickUseCase } from '../../application/use-cases/register-promo-click.use-case';
import { ResolveRedemptionCodeUseCase } from '../../application/use-cases/resolve-promo-code.use-case';

/** Códigos de canje autogenerados por promotor (descuento total). /api/v1/redemption-codes. */
@Controller('redemption-codes')
export class RedemptionCodesController {
  constructor(
    private readonly resolveRedemptionCode: ResolveRedemptionCodeUseCase,
    private readonly registerClick: RegisterRedemptionClickUseCase,
  ) {}

  /** Resuelve un código de canje para la landing `/p/<code>` y la precarga del checkout. */
  @Public()
  @Get('resolve/:code')
  async resolve(@Param('code') code: string): Promise<ResolveRedemptionCodeResponse> {
    return this.resolveRedemptionCode.execute(code);
  }

  /** Registra un clic del enlace corto `/p/<code>` (público). */
  @Public()
  @Post(':code/click')
  @HttpCode(HttpStatus.NO_CONTENT)
  async click(@Param('code') code: string): Promise<void> {
    await this.registerClick.execute(code);
  }
}
