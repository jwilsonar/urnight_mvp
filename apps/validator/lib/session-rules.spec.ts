import { describe, expect, it } from 'vitest';
import {
  claimsOf,
  hasValidatorRole,
  isTokenFresh,
  refreshFailureAction,
  sessionActionFor,
  type AccessClaims,
} from './session-rules';

/** Arma un JWT de mentira: solo el payload importa, la firma no se verifica aquí. */
function tokenWith(claims: AccessClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `cabecera.${payload}.firma`;
}

const ahora = Math.floor(Date.now() / 1000);
const vigente = tokenWith({ sub: 'u1', roles: ['validator'], exp: ahora + 3600 });
const vencido = tokenWith({ sub: 'u1', roles: ['validator'], exp: ahora - 10 });
const sinRol = tokenWith({ sub: 'u1', roles: ['attendee'], exp: ahora + 3600 });

describe('claimsOf', () => {
  it('decodifica el payload base64url del token', () => {
    expect(claimsOf(vigente)).toMatchObject({ sub: 'u1', roles: ['validator'] });
  });

  it('devuelve null si el token no tiene tres segmentos', () => {
    expect(claimsOf('no-es-un-jwt')).toBeNull();
  });

  it('devuelve null si no hay token', () => {
    expect(claimsOf(null)).toBeNull();
    expect(claimsOf(undefined)).toBeNull();
  });

  it('lee los claims aunque el token haya expirado', () => {
    expect(claimsOf(vencido)?.roles).toEqual(['validator']);
  });
});

describe('isTokenFresh', () => {
  it('acepta un token con expiración lejana', () => {
    expect(isTokenFresh(vigente)).toBe(true);
  });

  it('rechaza un token expirado', () => {
    expect(isTokenFresh(vencido)).toBe(false);
  });

  it('rechaza un token que expira dentro del margen de 30 s', () => {
    const alFilo = tokenWith({ roles: ['validator'], exp: ahora + 20 });
    expect(isTokenFresh(alFilo)).toBe(false);
    expect(isTokenFresh(alFilo, 0)).toBe(true);
  });

  it('rechaza un token sin exp', () => {
    expect(isTokenFresh(tokenWith({ roles: ['validator'] }))).toBe(false);
  });
});

describe('hasValidatorRole', () => {
  it('acepta claims con rol validator', () => {
    expect(hasValidatorRole(claimsOf(vigente))).toBe(true);
  });

  it('rechaza claims sin rol validator', () => {
    expect(hasValidatorRole(claimsOf(sinRol))).toBe(false);
  });

  it('rechaza claims nulos', () => {
    expect(hasValidatorRole(null)).toBe(false);
  });
});

describe('sessionActionFor', () => {
  it('usa el access cuando está fresco y porta el rol', () => {
    expect(sessionActionFor({ accessToken: vigente, refreshToken: vigente })).toBe('use');
  });

  it('renueva cuando el access venció pero el refresh sigue vigente', () => {
    expect(sessionActionFor({ accessToken: vencido, refreshToken: vigente })).toBe('refresh');
  });

  it('da la sesión por muerta si el refresh venció', () => {
    expect(sessionActionFor({ accessToken: vencido, refreshToken: vencido })).toBe('dead');
  });

  it('da la sesión por muerta si no hay refresh guardado', () => {
    expect(sessionActionFor({ accessToken: vigente, refreshToken: null })).toBe('dead');
  });

  it('da la sesión por muerta si el access no porta rol validator', () => {
    expect(sessionActionFor({ accessToken: sinRol, refreshToken: vigente })).toBe('dead');
  });
});

describe('refreshFailureAction', () => {
  it('sigue offline cuando la renovación falló por red', () => {
    expect(refreshFailureAction(null)).toBe('offline');
  });

  it('mata la sesión ante 401', () => {
    expect(refreshFailureAction(401)).toBe('dead');
  });

  it('mata la sesión ante 400', () => {
    expect(refreshFailureAction(400)).toBe('dead');
  });

  it('sigue offline ante un 5xx, que es transitorio', () => {
    expect(refreshFailureAction(503)).toBe('offline');
  });
});
