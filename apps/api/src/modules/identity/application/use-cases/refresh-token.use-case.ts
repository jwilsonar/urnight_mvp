import { Inject, Injectable } from '@nestjs/common';
import type { RefreshDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { AccountDisabledError, InvalidTokenError } from '../../domain/errors/identity.errors';
import { RefreshTokenStore } from '../../domain/ports/refresh-token-store.port';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

/**
 * Caso de uso: renovar el par de tokens con rotación de un solo uso (A2). Valida
 * que el `jti` del refresh siga vivo en el store; si no existe → rechaza (posible
 * reuso/robo). En el camino feliz rota: revoca el `jti` viejo y emite uno nuevo.
 */
@Injectable()
export class RefreshTokenUseCase {
  private readonly log = createLogger(RefreshTokenUseCase.name);

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

    // Rotación de un solo uso: el jti debe existir en el store (si no, fue rotado,
    // revocado o nunca emitido → posible reuso/robo). En ese caso se revoca toda la
    // familia de refresh del usuario (mitigación estándar de robo de token).
    if (!jti || !(await this.refreshStore.isValid(sub, jti))) {
      await this.refreshStore.revokeAllForUser(sub);
      this.log.warn({ userId: user.id }, 'identity.token.refresh_reuse');
      throw new InvalidTokenError();
    }
    await this.refreshStore.revoke(sub, jti);

    this.log.info({ userId: user.id }, 'identity.token.refreshed');
    // issueFor firma y registra el nuevo jti.
    return this.issuer.issueFor(user);
  }
}
