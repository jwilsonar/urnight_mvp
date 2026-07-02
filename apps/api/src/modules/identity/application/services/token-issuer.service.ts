import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import type { RoleCode } from '../../domain/entities/role.entity';
import type { User } from '../../domain/entities/user.entity';
import { RefreshTokenStore } from '../../domain/ports/refresh-token-store.port';
import { TokenService, type IssuedToken } from '../../domain/ports/token.port';
import { RoleResolver } from './role-resolver.service';

/** Resultado de un flujo de autenticación: usuario + roles + par de tokens. */
export interface AuthResult {
  user: User;
  roleCodes: RoleCode[];
  access: IssuedToken;
  refresh: IssuedToken;
}

/**
 * Servicio de aplicación: resuelve los roles activos del usuario (con su scope
 * multi-tenant) y firma el par access+refresh. El refresh lleva un `jti` único que
 * se persiste en el RefreshTokenStore → rotación + revocación server-side (A2).
 * Reutilizado por register/login/google/refresh.
 */
@Injectable()
export class TokenIssuer {
  private readonly log = createLogger(TokenIssuer.name);

  constructor(
    private readonly roleResolver: RoleResolver,
    private readonly tokens: TokenService,
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async issueFor(user: User): Promise<AuthResult> {
    const { assignments, roleCodes } = await this.roleResolver.resolveActive(user.id);

    // Scope multi-tenant: primera asignación con company/local (MVP: scope único por token).
    const scoped = assignments.find((a) => a.companyId !== null || a.localId !== null);

    const access = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      roles: roleCodes,
      companyId: scoped?.companyId ?? null,
      localId: scoped?.localId ?? null,
    });

    // Refresh con jti único → se registra en el store para rotación/revocación (A2).
    const jti = randomUUID();
    const refresh = await this.tokens.signRefresh(user.id, jti);
    await this.refreshStore.store(user.id, jti, refresh.expiresIn);

    this.log.debug({ userId: user.id }, 'identity.tokens.issued');
    return { user, roleCodes, access, refresh };
  }
}
