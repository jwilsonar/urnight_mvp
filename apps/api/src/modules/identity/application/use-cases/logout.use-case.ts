import { Injectable } from '@nestjs/common';
import type { LogoutDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { RefreshTokenStore } from '../../domain/ports/refresh-token-store.port';
import { TokenService } from '../../domain/ports/token.port';

/**
 * Caso de uso: logout. Revoca (borra el jti de) el refresh token actual → la
 * sesión deja de poder renovarse (A2). Idempotente: un token ya inválido/expirado
 * no otorga sesión, así que no se trata como error.
 */
@Injectable()
export class LogoutUseCase {
  private readonly log = createLogger(LogoutUseCase.name);

  constructor(
    private readonly tokens: TokenService,
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async execute(dto: LogoutDto): Promise<void> {
    try {
      const { sub, jti } = await this.tokens.verifyRefresh(dto.refreshToken);
      if (jti) await this.refreshStore.revoke(sub, jti);
      this.log.info({ userId: sub }, 'identity.logout.success');
    } catch {
      // Token inválido/expirado: logout idempotente, no hay sesión que cortar.
      this.log.debug({}, 'identity.logout.noop');
    }
  }
}
