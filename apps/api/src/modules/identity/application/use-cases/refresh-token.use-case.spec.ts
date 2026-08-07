import { describe, expect, it } from 'vitest';
import {
  InMemoryRoleAssignmentRepository,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  RoleMother,
  UserBuilder,
} from '../../../../shared/testing';
import { AccountDisabledError, InvalidTokenError } from '../../domain/errors/identity.errors';
import {
  TokenService,
  type AccessTokenClaims,
  type IssuedToken,
} from '../../domain/ports/token.port';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { InMemoryMfaRepository } from '../services/__testing__/in-memory-mfa-repository';
import { RoleResolver } from '../services/role-resolver.service';
import { TokenIssuer } from '../services/token-issuer.service';
import { RefreshTokenUseCase } from './refresh-token.use-case';

/**
 * TokenService que hace round-trip del `jti`: `signRefresh(sub, jti)` lo codifica
 * en el token (`refresh:<sub>:<jti>`) y `verifyRefresh` lo recupera. Permite probar
 * rotación/revocación real contra el store (el FakeTokenService compartido no lleva jti).
 */
class JtiTokenService extends TokenService {
  failVerify = false;

  async signAccess(claims: AccessTokenClaims): Promise<IssuedToken> {
    return { token: `access:${claims.sub}`, expiresIn: 900 };
  }
  async signRefresh(userId: string, jti = 'no-jti'): Promise<IssuedToken> {
    return { token: `refresh:${userId}:${jti}`, expiresIn: 604800 };
  }
  async verifyRefresh(token: string): Promise<{ sub: string; jti?: string }> {
    if (this.failVerify) throw new Error('refresh inválido');
    const parts = token.split(':');
    return { sub: parts[1] ?? '', jti: parts[2] };
  }
  async signEmailVerification(userId: string): Promise<string> {
    return `verify:${userId}`;
  }
  async verifyEmailVerification(token: string): Promise<{ sub: string }> {
    return { sub: token.split(':')[1] ?? '' };
  }
  async signEmailChange(input: { sub: string; newEmail: string }): Promise<string> {
    return `email-change:${input.sub}:${input.newEmail}`;
  }
  async verifyEmailChange(): Promise<{ sub: string; newEmail: string }> {
    return { sub: 'x', newEmail: 'nuevo@example.test' };
  }
}

function build() {
  const users = new InMemoryUserRepository();
  const tokens = new JtiTokenService();
  const assignments = new InMemoryRoleAssignmentRepository();
  const roles = new InMemoryRoleRepository().seed(RoleMother.user());
  const store = new InMemoryRefreshTokenStore();
  const issuer = new TokenIssuer(
    new RoleResolver(assignments, roles),
    tokens,
    store,
    new InMemoryMfaRepository(),
  );
  const useCase = new RefreshTokenUseCase(users, tokens, issuer, store);
  return { users, tokens, assignments, roles, store, issuer, useCase };
}

describe('RefreshTokenUseCase', () => {
  it('rota el refresh: emite un par nuevo y revoca (invalida) el jti viejo', async () => {
    const { users, issuer, store, useCase } = build();
    const user = new UserBuilder().withId('u1').build();
    await users.create(user);
    const first = await issuer.issueFor(user);
    expect(store.countFor('u1')).toBe(1);

    const result = await useCase.execute({ refreshToken: first.refresh.token });

    expect(result.user.id).toBe('u1');
    // Rotación: el jti viejo se revocó y se registró uno nuevo → sigue habiendo 1.
    expect(store.countFor('u1')).toBe(1);
    expect(result.refresh.token).not.toBe(first.refresh.token);
  });

  it('hace idempotentes dos refresh simultaneos dentro de la ventana de gracia', async () => {
    const { users, issuer, store, useCase } = build();
    const user = new UserBuilder().withId('u-race').build();
    await users.create(user);
    const first = await issuer.issueFor(user);

    const [left, right] = await Promise.all([
      useCase.execute({ refreshToken: first.refresh.token }),
      useCase.execute({ refreshToken: first.refresh.token }),
    ]);

    expect(left.access.token).toBe(right.access.token);
    expect(left.refresh.token).toBe(right.refresh.token);
    expect(store.countFor('u-race')).toBe(1);
    await expect(useCase.execute({ refreshToken: left.refresh.token })).resolves.toMatchObject({
      user: { id: 'u-race' },
    });
  });

  it('fuera de la gracia, reutilizar el jti revoca toda la familia (posible robo)', async () => {
    const { users, issuer, store, useCase } = build();
    const user = new UserBuilder().withId('u1').build();
    await users.create(user);
    const first = await issuer.issueFor(user);

    const rotated = await useCase.execute({ refreshToken: first.refresh.token }); // rota
    store.expireRotations();
    // El token viejo ya no vale: su jti fue revocado.
    await expect(useCase.execute({ refreshToken: first.refresh.token })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
    // El reuso disparó revocación total: ni siquiera el refresh rotado sigue vivo.
    expect(store.countFor('u1')).toBe(0);
    await expect(useCase.execute({ refreshToken: rotated.refresh.token })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it('rechaza un refresh cuyo jti no está en el store (nunca emitido / revocado)', async () => {
    const { users, useCase } = build();
    const user = new UserBuilder().withId('u2').build();
    await users.create(user);
    await expect(
      useCase.execute({ refreshToken: 'refresh:u2:jti-fantasma' }),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('refresh válido pero usuario inexistente → InvalidTokenError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ refreshToken: 'refresh:ghost:jti-x' }),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('cuenta deshabilitada → AccountDisabledError', async () => {
    const { users, useCase } = build();
    const user = new UserBuilder().withId('u3').asInactive().build();
    await users.create(user);
    await expect(
      useCase.execute({ refreshToken: 'refresh:u3:jti-x' }),
    ).rejects.toBeInstanceOf(AccountDisabledError);
  });

  it('token criptográficamente inválido propaga el fallo de verificación', async () => {
    const { tokens, useCase } = build();
    tokens.failVerify = true;
    await expect(useCase.execute({ refreshToken: 'whatever' })).rejects.toThrow();
  });
});
