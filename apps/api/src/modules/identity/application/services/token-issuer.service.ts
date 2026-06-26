import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { RoleCode } from '../../domain/entities/role.entity';
import type { User } from '../../domain/entities/user.entity';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/ports/role.repository';
import { TokenService, type IssuedToken } from '../../domain/ports/token.port';

/** Resultado de un flujo de autenticación: usuario + roles + par de tokens. */
export interface AuthResult {
  user: User;
  roleCodes: RoleCode[];
  access: IssuedToken;
  refresh: IssuedToken;
}

/**
 * Servicio de aplicación: resuelve los roles activos del usuario (con su scope
 * multi-tenant) y firma el par access+refresh. Reutilizado por register/login/google.
 */
@Injectable()
export class TokenIssuer {
  private readonly log = createLogger(TokenIssuer.name);

  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignments: RoleAssignmentRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly tokens: TokenService,
  ) {}

  async issueFor(user: User): Promise<AuthResult> {
    const active = await this.assignments.findActiveByUser(user.id);
    const codeById = new Map((await this.roles.listAll()).map((r) => [r.id, r.code]));
    const roleCodes = active
      .map((a) => codeById.get(a.roleId))
      .filter((c): c is RoleCode => c !== undefined);

    // Scope multi-tenant: primera asignación con company/local (MVP: scope único por token).
    const scoped = active.find((a) => a.companyId !== null || a.localId !== null);

    const access = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      roles: roleCodes,
      companyId: scoped?.companyId ?? null,
      localId: scoped?.localId ?? null,
    });
    const refresh = await this.tokens.signRefresh(user.id);

    this.log.debug({ userId: user.id }, 'identity.tokens.issued');
    return { user, roleCodes, access, refresh };
  }
}
