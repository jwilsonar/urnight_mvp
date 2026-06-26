import { Inject, Injectable } from '@nestjs/common';
import type { RefreshDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { AccountDisabledError, InvalidTokenError } from '../../domain/errors/identity.errors';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

/** Caso de uso: renovar el access token a partir de un refresh válido. */
@Injectable()
export class RefreshTokenUseCase {
  private readonly log = createLogger(RefreshTokenUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(dto: RefreshDto): Promise<AuthResult> {
    this.log.debug({}, 'identity.token.refresh_started');
    const { sub } = await this.tokens.verifyRefresh(dto.refreshToken);
    const user = await this.users.findById(sub);
    if (!user) {
      this.log.warn({}, 'identity.token.refresh_invalid');
      throw new InvalidTokenError();
    }
    if (!user.isActive) {
      this.log.warn({ userId: user.id }, 'identity.login.account_disabled');
      throw new AccountDisabledError();
    }

    this.log.info({ userId: user.id }, 'identity.token.refreshed');
    return this.issuer.issueFor(user);
  }
}
