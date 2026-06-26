import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../decorators/current-user.decorator';
import { ROLES_KEY, type Role } from '../decorators/roles.decorator';

/**
 * Roles Guard (RBAC §5). Corre DESPUÉS del AuthGuard: exige que `req.user.roles`
 * intersecte los roles declarados con @Roles. `super_admin` pasa todo. El scope
 * multi-tenant fino (company_id/local_id) lo evalúa cada caso de uso.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const roles = req.user?.roles ?? [];
    if (roles.includes('super_admin')) return true;
    if (!required.some((r) => roles.includes(r))) {
      throw new ForbiddenException('No tienes el rol requerido para esta acción');
    }
    return true;
  }
}
