import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../../config/env.schema';
import { RoleResolver } from './application/services/role-resolver.service';
import { TokenIssuer } from './application/services/token-issuer.service';
import { UserProvisioningService } from './application/services/user-provisioning.service';
import { PromoterConfirmedSubscriber } from './application/subscribers/promoter-confirmed.subscriber';
import { AcceptLegalDocumentUseCase } from './application/use-cases/accept-legal-document.use-case';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';
import { GetCurrentLegalDocumentUseCase } from './application/use-cases/get-current-legal-document.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { GoogleLoginUseCase } from './application/use-cases/google-login.use-case';
import { GrantRoleUseCase } from './application/use-cases/grant-role.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ListEnrichedFavoritesUseCase } from './application/use-cases/list-enriched-favorites.use-case';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { PublishLegalDocumentUseCase } from './application/use-cases/publish-legal-document.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';
import { RevokeRoleUseCase } from './application/use-cases/revoke-role.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { GoogleVerifier } from './domain/ports/google-verifier.port';
import {
  LEGAL_ACCEPTANCE_REPOSITORY,
  LEGAL_DOCUMENT_REPOSITORY,
} from './domain/ports/legal.repository';
import { PasswordHasher } from './domain/ports/password-hasher.port';
import { RefreshTokenStore } from './domain/ports/refresh-token-store.port';
import { ROLE_ASSIGNMENT_REPOSITORY } from './domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY } from './domain/ports/role.repository';
import { TokenService } from './domain/ports/token.port';
import { USER_FAVORITE_REPOSITORY } from './domain/ports/user-favorite.repository';
import { USER_PREFERENCE_REPOSITORY } from './domain/ports/user-preference.repository';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password-hasher';
import { GoogleOidcVerifier } from './infrastructure/auth/google-oidc.verifier';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { RedisRefreshTokenStore } from './infrastructure/auth/redis-refresh-token-store';
import { DrizzleLegalAcceptanceRepository } from './infrastructure/persistence/drizzle-legal-acceptance.repository';
import { DrizzleLegalDocumentRepository } from './infrastructure/persistence/drizzle-legal-document.repository';
import { DrizzleRoleAssignmentRepository } from './infrastructure/persistence/drizzle-role-assignment.repository';
import { DrizzleRoleRepository } from './infrastructure/persistence/drizzle-role.repository';
import { DrizzleUserFavoriteRepository } from './infrastructure/persistence/drizzle-user-favorite.repository';
import { DrizzleUserPreferenceRepository } from './infrastructure/persistence/drizzle-user-preference.repository';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository';
import { AuthController } from './interfaces/http/auth.controller';
import { FavoritesController } from './interfaces/http/favorites.controller';
import { LegalController } from './interfaces/http/legal.controller';
import { PreferencesController } from './interfaces/http/preferences.controller';
import { RolesController } from './interfaces/http/roles.controller';

/**
 * Bounded context Identity, Access & Legal (§4.1). Liga puertos → adapters (DI).
 * Registra JwtModule global para que el JwtTokenService firme y el AuthGuard
 * (edge) verifique con el mismo secreto de acceso.
 */
@Module({
  imports: [
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
  ],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    GoogleLoginUseCase,
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
    UserProvisioningService,
    PromoterConfirmedSubscriber,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: ROLE_REPOSITORY, useClass: DrizzleRoleRepository },
    { provide: ROLE_ASSIGNMENT_REPOSITORY, useClass: DrizzleRoleAssignmentRepository },
    { provide: USER_PREFERENCE_REPOSITORY, useClass: DrizzleUserPreferenceRepository },
    { provide: USER_FAVORITE_REPOSITORY, useClass: DrizzleUserFavoriteRepository },
    { provide: LEGAL_DOCUMENT_REPOSITORY, useClass: DrizzleLegalDocumentRepository },
    { provide: LEGAL_ACCEPTANCE_REPOSITORY, useClass: DrizzleLegalAcceptanceRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: RefreshTokenStore, useClass: RedisRefreshTokenStore },
    { provide: GoogleVerifier, useClass: GoogleOidcVerifier },
  ],
})
export class IdentityModule {}
