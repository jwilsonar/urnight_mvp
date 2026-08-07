import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  changePhoneSchema,
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  type ChangePhoneDto,
  type ConfirmEmailChangeDto,
  type RequestEmailChangeDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ChangePhoneUseCase } from '../../application/use-cases/change-phone.use-case';
import { ConfirmEmailChangeUseCase } from '../../application/use-cases/confirm-email-change.use-case';
import { RequestEmailChangeUseCase } from '../../application/use-cases/request-email-change.use-case';

@Controller('users/me')
export class UsersController {
  constructor(
    private readonly requestEmailChange: RequestEmailChangeUseCase,
    private readonly confirmEmailChange: ConfirmEmailChangeUseCase,
    private readonly changePhone: ChangePhoneUseCase,
  ) {}

  @Post('email/change-request')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestEmail(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(requestEmailChangeSchema)) dto: RequestEmailChangeDto,
  ): Promise<void> {
    await this.requestEmailChange.execute({ userId: user.id, ...dto });
  }

  @Public()
  @Post('email/change-confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body(new ZodValidationPipe(confirmEmailChangeSchema)) dto: ConfirmEmailChangeDto,
  ): Promise<void> {
    await this.confirmEmailChange.execute(dto);
  }

  @Patch('phone')
  @HttpCode(HttpStatus.NO_CONTENT)
  async phone(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(changePhoneSchema)) dto: ChangePhoneDto,
  ): Promise<void> {
    await this.changePhone.execute({ userId: user.id, ...dto });
  }
}
