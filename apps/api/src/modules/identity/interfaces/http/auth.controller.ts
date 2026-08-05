import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  useRecoveryCodeSchema,
  verifyMfaChallengeSchema,
  refreshSchema,
  registerSchema,
  verifyEmailSchema,
  type AuthTokensResponse,
  type GoogleLoginDto,
  type LoginDto,
  type LogoutDto,
  type LoginOutcomeResponse,
  type RefreshDto,
  type RegisterDto,
  type UserProfileResponse,
  type UseRecoveryCodeDto,
  type VerifyMfaChallengeDto,
  type VerifyEmailDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { RateLimit } from '../../../../edge/decorators/rate-limit.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { GoogleLoginUseCase } from '../../application/use-cases/google-login.use-case';
import { GetMeUseCase, type GetMeResult } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { UseRecoveryCodeUseCase } from '../../application/use-cases/use-recovery-code.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { VerifyMfaChallengeUseCase } from '../../application/use-cases/verify-mfa-challenge.use-case';
import type { LoginOutcome } from '../../application/services/mfa-login.service';
import type { AuthResult } from '../../application/services/token-issuer.service';

/** Adapter driving (REST) — autenticación e identidad. /api/v1/auth. */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly googleLogin: GoogleLoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logoutUser: LogoutUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly getMe: GetMeUseCase,
    private readonly verifyMfa: VerifyMfaChallengeUseCase,
    private readonly recoveryMfa: UseRecoveryCodeUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ): Promise<AuthTokensResponse> {
    return toTokens(await this.register.execute(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
  ): Promise<LoginOutcomeResponse> {
    return toLoginOutcome(await this.login.execute(dto));
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(
    @Body(new ZodValidationPipe(googleLoginSchema)) dto: GoogleLoginDto,
  ): Promise<LoginOutcomeResponse> {
    return toLoginOutcome(await this.googleLogin.execute(dto));
  }

  @Public()
  @RateLimit({ limit: 5, windowSec: 300, keyBy: ['ip', 'challenge'], failClosed: true })
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfaChallenge(
    @Body(new ZodValidationPipe(verifyMfaChallengeSchema)) dto: VerifyMfaChallengeDto,
  ): Promise<AuthTokensResponse> {
    return toTokens(await this.verifyMfa.execute(dto));
  }

  @Public()
  @RateLimit({ limit: 5, windowSec: 300, keyBy: ['ip', 'challenge'], failClosed: true })
  @Post('mfa/recovery')
  @HttpCode(HttpStatus.OK)
  async useRecoveryCode(
    @Body(new ZodValidationPipe(useRecoveryCodeSchema)) dto: UseRecoveryCodeDto,
  ): Promise<AuthTokensResponse> {
    return toTokens(await this.recoveryMfa.execute(dto));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto,
  ): Promise<AuthTokensResponse> {
    return toTokens(await this.refresh.execute(dto));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(logoutSchema)) dto: LogoutDto,
  ): Promise<void> {
    await this.logoutUser.execute(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailDto,
  ): Promise<{ emailVerified: boolean }> {
    const user = await this.verifyEmail.execute(dto);
    return { emailVerified: user.emailVerified };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<UserProfileResponse> {
    return toProfile(await this.getMe.execute({ userId: user.id }));
  }
}

function toTokens(result: AuthResult): AuthTokensResponse {
  return {
    accessToken: result.access.token,
    refreshToken: result.refresh.token,
    tokenType: 'Bearer',
    expiresIn: result.access.expiresIn,
  };
}

function toLoginOutcome(outcome: LoginOutcome): LoginOutcomeResponse {
  if (outcome.kind === 'mfa_challenge') return outcome;
  return { kind: 'session', result: toTokens(outcome.result) };
}

function toProfile(result: GetMeResult): UserProfileResponse {
  const u = result.user;
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    authProvider: u.authProvider,
    emailVerified: u.emailVerified,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    documentType: u.identity?.documentType ?? null,
    documentNumber: u.identity?.documentNumber ?? null,
    birthDate: u.identity ? u.identity.birthDate.toISOString().slice(0, 10) : null,
    roles: result.roleCodes,
    onboardingCompleted: result.preference?.onboardingCompleted ?? false,
    createdAt: u.createdAt.toISOString(),
  };
}
