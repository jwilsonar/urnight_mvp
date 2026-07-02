import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';
import type { Role } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { createLogger } from '../../shared/logging/logger';

interface AccessClaims {
  sub: string;
  email?: string;
  roles?: Role[];
  companyId?: string | null;
  localId?: string | null;
}

/**
 * Auth Guard (JWT) — §2.2. Verifica el Bearer access token y adjunta la
 * identidad (`req.user`) con roles + scope multi-tenant. Respeta @Public.
 * El secreto/algoritmo provienen del JwtModule global (módulo Identity).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly log = createLogger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      this.log.warn({ path: req.url }, 'auth.token.missing');
      throw new UnauthorizedException('Falta el token de acceso');
    }

    try {
      // Allowlist de algoritmos (B): solo HS256; evita ataques de confusión de algoritmo.
      const claims = await this.jwt.verifyAsync<AccessClaims>(header.slice(7), {
        algorithms: ['HS256'],
      });
      req.user = {
        id: claims.sub,
        email: claims.email ?? undefined,
        roles: claims.roles ?? [],
        companyId: claims.companyId ?? undefined,
        localId: claims.localId ?? undefined,
      };
      this.log.debug({ userId: claims.sub, roles: claims.roles ?? [] }, 'auth.authenticated');
      return true;
    } catch {
      this.log.warn({ path: req.url }, 'auth.token.invalid');
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
