import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { validateQrSchema, type QrValidationResponse, type ValidateQrDto } from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ValidateQrUseCase } from '../../application/use-cases/validate-qr.use-case';

/** Validación de QR en puerta (app validador). /api/v1/validations. */
@Roles('validator')
@Controller('validations')
export class ValidationController {
  constructor(private readonly validateQr: ValidateQrUseCase) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scan(
    @CurrentUser() validator: AuthUser,
    @Body(new ZodValidationPipe(validateQrSchema)) dto: ValidateQrDto,
  ): Promise<QrValidationResponse> {
    return this.validateQr.execute({ dto, validatorId: validator.id });
  }
}
