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

  // Regresión: bloquear /auth/me dejaba a la cuenta sin poder construir sesión,
  // así que ni siquiera llegaba a la pantalla de enrolamiento.
  it('permite el arranque de sesión y el cierre con enrolamiento pendiente', () => {
    expect(guard.canActivate(context('/api/v1/auth/me', true))).toBe(true);
    expect(guard.canActivate(context('/api/v1/auth/refresh', true))).toBe(true);
    expect(guard.canActivate(context('/api/v1/auth/logout', true))).toBe(true);
    expect(guard.canActivate(context('/api/v1/mfa/status', true))).toBe(true);
  });

  it('no bloquea a un principal sin mfaPending, como promoter', () => {
    expect(guard.canActivate(context('/api/v1/promoters/me', false))).toBe(true);
  });
});
