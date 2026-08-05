import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MfaRequiredError } from '../../modules/identity/domain/errors/identity.errors';
import { MfaEnrollmentGuard } from './mfa-enrollment.guard';

function context(path: string, mfaPending?: boolean): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        url: path,
        originalUrl: path,
        user: mfaPending === undefined
          ? undefined
          : { id: 'u1', roles: ['admin_local'], mfaPending },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('MfaEnrollmentGuard', () => {
  const guard = new MfaEnrollmentGuard();

  it('bloquea rutas de panel para admin_local con enrolamiento pendiente', () => {
    expect(() => guard.canActivate(context('/api/v1/locals/mine', true))).toThrow(
      MfaRequiredError,
    );
  });

  it('permite iniciar y confirmar enrolamiento aunque mfaPending sea true', () => {
    expect(guard.canActivate(context('/api/v1/mfa/enroll', true))).toBe(true);
    expect(guard.canActivate(context('/api/v1/mfa/enroll/confirm', true))).toBe(true);
  });

  it('no bloquea a un principal sin mfaPending, como promoter', () => {
    expect(guard.canActivate(context('/api/v1/promoters/me', false))).toBe(true);
  });
});
