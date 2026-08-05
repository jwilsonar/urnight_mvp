import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { MfaRequiredError } from '../../modules/identity/domain/errors/identity.errors';
import type { AuthUser } from '../decorators/current-user.decorator';

const MFA_PENDING_ALLOWLIST = ['/mfa/enroll', '/mfa/enroll/confirm'] as const;

/** Estado único del edge para sesiones admin que aún deben enrolar MFA. */
@Injectable()
export class MfaEnrollmentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    if (!req.user?.mfaPending) return true;

    const path = this.pathOf(req);
    if (MFA_PENDING_ALLOWLIST.some((suffix) => path.endsWith(suffix))) return true;
    throw new MfaRequiredError();
  }

  private pathOf(req: Request): string {
    const url = req.originalUrl ?? req.url ?? '';
    const query = url.indexOf('?');
    return query === -1 ? url : url.slice(0, query);
  }
}
