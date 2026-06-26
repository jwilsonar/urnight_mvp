import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from './roles.decorator';

/** Identidad autenticada adjuntada por AuthGuard. */
export interface AuthUser {
  readonly id: string;
  readonly email?: string;
  readonly roles: Role[];
  readonly companyId?: string;
  readonly localId?: string;
}

/** Inyecta el usuario autenticado en un handler: `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user;
  },
);
