import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  confirmMfaEnrollmentSchema,
  mfaReauthenticationSchema,
  unlockMfaSchema,
  type ConfirmMfaEnrollmentDto,
  type MfaReauthenticationDto,
  type MfaStatusResponse,
  type RecoveryCodesResponse,
  type StartMfaEnrollmentResponse,
  type UnlockMfaDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ConfirmMfaEnrollmentUseCase } from '../../application/use-cases/confirm-mfa-enrollment.use-case';
import { GetMfaStatusUseCase } from '../../application/use-cases/get-mfa-status.use-case';
import { RegenerateRecoveryCodesUseCase } from '../../application/use-cases/regenerate-recovery-codes.use-case';
import { RevokeMfaUseCase } from '../../application/use-cases/revoke-mfa.use-case';
import { StartMfaEnrollmentUseCase } from '../../application/use-cases/start-mfa-enrollment.use-case';
import { UnlockMfaUseCase } from '../../application/use-cases/unlock-mfa.use-case';

@Controller('mfa')
export class MfaController {
  constructor(
    private readonly startEnrollment: StartMfaEnrollmentUseCase,
    private readonly confirmEnrollment: ConfirmMfaEnrollmentUseCase,
    private readonly revokeFactor: RevokeMfaUseCase,
    private readonly regenerateCodes: RegenerateRecoveryCodesUseCase,
    private readonly getStatus: GetMfaStatusUseCase,
    private readonly unlockFactor: UnlockMfaUseCase,
  ) {}

  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  enroll(@CurrentUser() user: AuthUser): Promise<StartMfaEnrollmentResponse> {
    return this.startEnrollment.execute({ userId: user.id });
  }

  @Post('enroll/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(confirmMfaEnrollmentSchema)) dto: ConfirmMfaEnrollmentDto,
  ): Promise<RecoveryCodesResponse> {
    return this.confirmEnrollment.execute({ userId: user.id, code: dto.code });
  }

  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(mfaReauthenticationSchema)) dto: MfaReauthenticationDto,
  ): Promise<void> {
    await this.revokeFactor.execute({ userId: user.id, password: dto.password });
  }

  @Post('recovery-codes')
  @HttpCode(HttpStatus.OK)
  regenerate(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(mfaReauthenticationSchema)) dto: MfaReauthenticationDto,
  ): Promise<RecoveryCodesResponse> {
    return this.regenerateCodes.execute({ userId: user.id, password: dto.password });
  }

  @Get('status')
  status(@CurrentUser() user: AuthUser): Promise<MfaStatusResponse> {
    return this.getStatus.execute({ userId: user.id });
  }

  @Roles('super_admin')
  @Post('unlock')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlock(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(unlockMfaSchema)) dto: UnlockMfaDto,
  ): Promise<void> {
    await this.unlockFactor.execute({
      actorUserId: actor.id,
      actorRoles: actor.roles,
      targetUserId: dto.userId,
      reason: dto.reason,
    });
  }
}
