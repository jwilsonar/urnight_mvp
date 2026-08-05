import { Inject, Injectable } from '@nestjs/common';
import type { RefreshDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { AccountDisabledError, InvalidTokenError } from '../../domain/errors/identity.errors';
import {
  RefreshTokenStore,
  type RefreshRotationResult,
} from '../../domain/ports/refresh-token-store.port';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

/**
 * Caso de uso: renovar el par de tokens con rotación de un solo uso (A2). La
 * rotación conserva una gracia idempotente corta para requests concurrentes;
 * fuera de ella, un `jti` ausente sigue tratándose como posible reuso o robo.
 */
@Injectable()
export class RefreshTokenUseCase {
  private readonly log = createLogger(RefreshTokenUseCase.name);
  private static readonly ROTATION_GRACE_SECONDS = 60;
  private static readonly ROTATION_WAIT_ATTEMPTS = 40;
  private static readonly ROTATION_WAIT_MS = 25;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly issuer: TokenIssuer,
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async execute(dto: RefreshDto): Promise<AuthResult> {
    this.log.debug({}, 'identity.token.refresh_started');
    const { sub, jti } = await this.tokens.verifyRefresh(dto.refreshToken);
    const user = await this.users.findById(sub);
    if (!user) {
      this.log.warn({}, 'identity.token.refresh_invalid');
      throw new InvalidTokenError();
    }
    if (!user.isActive) {
      this.log.warn({ userId: user.id }, 'identity.login.account_disabled');
      throw new AccountDisabledError();
    }

    // La primera petición reclama el jti; las concurrentes reutilizan durante la
    // gracia el par emitido. Solo un jti ausente dispara la protección antifraude.
    if (!jti) {
      await this.refreshStore.revokeAllForUser(sub);
      this.log.warn({ userId: user.id }, 'identity.token.refresh_reuse');
      throw new InvalidTokenError();
    }

    const rotation = await this.refreshStore.beginRotation(
      sub,
      jti,
      RefreshTokenUseCase.ROTATION_GRACE_SECONDS,
    );
    if (rotation.status === 'invalid') {
      await this.refreshStore.revokeAllForUser(sub);
      this.log.warn({ userId: user.id }, 'identity.token.refresh_reuse');
      throw new InvalidTokenError();
    }
    if (rotation.status === 'rotated') return this.fromRotation(user, rotation.result);
    if (rotation.status === 'pending') {
      const completed = await this.waitForRotation(sub, jti);
      if (completed) return this.fromRotation(user, completed);
    }

    this.log.info({ userId: user.id }, 'identity.token.refreshed');
    const result = await this.issuer.issueFor(user);
    await this.refreshStore.completeRotation(
      sub,
      jti,
      {
        roleCodes: result.roleCodes,
        access: result.access,
        refresh: result.refresh,
      },
      RefreshTokenUseCase.ROTATION_GRACE_SECONDS,
    );
    return result;
  }

  private async waitForRotation(
    userId: string,
    jti: string,
  ): Promise<RefreshRotationResult | null> {
    for (let attempt = 0; attempt < RefreshTokenUseCase.ROTATION_WAIT_ATTEMPTS; attempt += 1) {
      const result = await this.refreshStore.getRotation(userId, jti);
      if (result) return result;
      await new Promise((resolve) => setTimeout(resolve, RefreshTokenUseCase.ROTATION_WAIT_MS));
    }
    return null;
  }

  private fromRotation(user: AuthResult['user'], rotation: RefreshRotationResult): AuthResult {
    return { user, ...rotation };
  }
}
