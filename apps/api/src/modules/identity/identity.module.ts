import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../../config/env.schema';
import { EmailModule } from '../../shared/adapters/email/email.module';
import { RoleResolver } from './application/services/role-resolver.service';
import { MfaLoginService } from './application/services/mfa-login.service';
import { TokenIssuer } from './application/services/token-issuer.service';
import { UserProvisioningService } from './application/services/user-provisioning.service';
import { PromoterConfirmedSubscriber } from './application/subscribers/promoter-confirmed.subscriber';
import { AcceptLegalDocumentUseCase } from './application/use-cases/accept-legal-document.use-case';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';
import { ChangePhoneUseCase } from './application/use-cases/change-phone.use-case';
import { ConfirmEmailChangeUseCase } from './application/use-cases/confirm-email-change.use-case';
import { GetCurrentLegalDocumentUseCase } from './application/use-cases/get-current-legal-document.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { GoogleLoginUseCase } from './application/use-cases/google-login.use-case';
import { ConfirmMfaEnrollmentUseCase } from './application/use-cases/confirm-mfa-enrollment.use-case';
import { GetMfaStatusUseCase } from './application/use-cases/get-mfa-status.use-case';
import { RegenerateRecoveryCodesUseCase } from './application/use-cases/regenerate-recovery-codes.use-case';
import { RevokeMfaUseCase } from './application/use-cases/revoke-mfa.use-case';
import { StartMfaEnrollmentUseCase } from './application/use-cases/start-mfa-enrollment.use-case';
import { UnlockMfaUseCase } from './application/use-cases/unlock-mfa.use-case';
import { UseRecoveryCodeUseCase } from './application/use-cases/use-recovery-code.use-case';
import { VerifyMfaChallengeUseCase } from './application/use-cases/verify-mfa-challenge.use-case';
import { GrantRoleUseCase } from './application/use-cases/grant-role.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ListEnrichedFavoritesUseCase } from './application/use-cases/list-enriched-favorites.use-case';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { PublishLegalDocumentUseCase } from './application/use-cases/publish-legal-document.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { RequestEmailChangeUseCase } from './application/use-cases/request-email-change.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';
import { RevokeRoleUseCase } from './application/use-cases/revoke-role.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { SendMfaEmailCodeUseCase } from './application/use-cases/send-mfa-email-code.use-case';
import { VerifyMfaEmailCodeUseCase } from './application/use-cases/verify-mfa-email-code.use-case';
import { GoogleVerifier } from './domain/ports/google-verifier.port';
import {
  LEGAL_ACCEPTANCE_REPOSITORY,
  LEGAL_DOCUMENT_REPOSITORY,
} from './domain/ports/legal.repository';
import { PasswordHasher } from './domain/ports/password-hasher.port';
import { MFA_REPOSITORY } from './domain/ports/mfa.repository';
import { RefreshTokenStore } from './domain/ports/refresh-token-store.port';
import { OTP_CODE_STORE } from './domain/ports/otp-code.store';
import { ROLE_ASSIGNMENT_REPOSITORY } from './domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY } from './domain/ports/role.repository';
import { TokenService } from './domain/ports/token.port';
import { TOTP_PORT } from './domain/ports/totp.port';
import { USER_FAVORITE_REPOSITORY } from './domain/ports/user-favorite.repository';
import { USER_PREFERENCE_REPOSITORY } from './domain/ports/user-preference.repository';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password-hasher';
import { AesGcmSecretCipher } from './infrastructure/auth/aes-gcm-secret-cipher';
import { GoogleOidcVerifier } from './infrastructure/auth/google-oidc.verifier';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { NodeTotpAdapter } from './infrastructure/auth/node-totp.adapter';
import { RedisRefreshTokenStore } from './infrastructure/auth/redis-refresh-token-store';
import { DrizzleLegalAcceptanceRepository } from './infrastructure/persistence/drizzle-legal-acceptance.repository';
import { DrizzleMfaRepository } from './infrastructure/persistence/drizzle-mfa.repository';
import { RedisOtpCodeStore } from './infrastructure/persistence/redis-otp-code.store';
import { DrizzleLegalDocumentRepository } from './infrastructure/persistence/drizzle-legal-document.repository';
import { DrizzleRoleAssignmentRepository } from './infrastructure/persistence/drizzle-role-assignment.repository';
import { DrizzleRoleRepository } from './infrastructure/persistence/drizzle-role.repository';
import { DrizzleUserFavoriteRepository } from './infrastructure/persistence/drizzle-user-favorite.repository';
import { DrizzleUserPreferenceRepository } from './infrastructure/persistence/drizzle-user-preference.repository';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository';
import { AuthController } from './interfaces/http/auth.controller';
import { FavoritesController } from './interfaces/http/favorites.controller';
import { LegalController } from './interfaces/http/legal.controller';
import { MfaController } from './interfaces/http/mfa.controller';
import { PreferencesController } from './interfaces/http/preferences.controller';
import { RolesController } from './interfaces/http/roles.controller';
import { UsersController } from './interfaces/http/users.controller';

/**
 * Bounded context Identity, Access & Legal (§4.1). Liga puertos → adapters (DI).
 * Registra JwtModule global para que el JwtTokenService firme y el AuthGuard
 * (edge) verifique con el mismo secreto de acceso.
 */
@Module({
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.getOrThrow('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: config.getOrThrow('JWT_ACCESS_TTL', { infer: true }) },
      }),
    }),
  ],
  controllers: [
    AuthController,
    PreferencesController,
    FavoritesController,
    RolesController,
    LegalController,
    MfaController,
    UsersController,
  ],
  providers: [
    RegisterUseCase,
    RequestEmailChangeUseCase,
    ConfirmEmailChangeUseCase,
    ChangePhoneUseCase,
    LoginUseCase,
    GoogleLoginUseCase,
    StartMfaEnrollmentUseCase,
    ConfirmMfaEnrollmentUseCase,
    VerifyMfaChallengeUseCase,
    UseRecoveryCodeUseCase,
    SendMfaEmailCodeUseCase,
    VerifyMfaEmailCodeUseCase,
    RevokeMfaUseCase,
    RegenerateRecoveryCodesUseCase,
    GetMfaStatusUseCase,
    UnlockMfaUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    VerifyEmailUseCase,
    GetMeUseCase,
    GrantRoleUseCase,
    RevokeRoleUseCase,
    CompleteOnboardingUseCase,
    UpdatePreferencesUseCase,
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListFavoritesUseCase,
    ListEnrichedFavoritesUseCase,
    PublishLegalDocumentUseCase,
    AcceptLegalDocumentUseCase,
    GetCurrentLegalDocumentUseCase,
    RoleResolver,
    TokenIssuer,
    MfaLoginService,
    UserProvisioningService,
    PromoterConfirmedSubscriber,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: ROLE_REPOSITORY, useClass: DrizzleRoleRepository },
    { provide: ROLE_ASSIGNMENT_REPOSITORY, useClass: DrizzleRoleAssignmentRepository },
    { provide: USER_PREFERENCE_REPOSITORY, useClass: DrizzleUserPreferenceRepository },
    { provide: USER_FAVORITE_REPOSITORY, useClass: DrizzleUserFavoriteRepository },
    { provide: LEGAL_DOCUMENT_REPOSITORY, useClass: DrizzleLegalDocumentRepository },
    { provide: LEGAL_ACCEPTANCE_REPOSITORY, useClass: DrizzleLegalAcceptanceRepository },
    { provide: MFA_REPOSITORY, useClass: DrizzleMfaRepository },
    { provide: OTP_CODE_STORE, useClass: RedisOtpCodeStore },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: RefreshTokenStore, useClass: RedisRefreshTokenStore },
    { provide: GoogleVerifier, useClass: GoogleOidcVerifier },
    { provide: TOTP_PORT, useClass: NodeTotpAdapter },
    AesGcmSecretCipher,
  ],
})
export class IdentityModule {}
