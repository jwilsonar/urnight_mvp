import { describe, expect, it } from 'vitest';
import {
  TokenService,
  type AccessTokenClaims,
  type IssuedToken,
} from '../../domain/ports/token.port';
import { InMemoryRefreshTokenStore } from '../services/__testing__/in-memory-refresh-token-store';
import { LogoutUseCase } from './logout.use-case';

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
  const tokens = new JtiTokenService();
  const store = new InMemoryRefreshTokenStore();
  const useCase = new LogoutUseCase(tokens, store);
  return { tokens, store, useCase };
}

describe('LogoutUseCase', () => {
  it('revoca el jti del refresh actual (corta la sesión)', async () => {
    const { store, useCase } = build();
    await store.store('u1', 'jti-1', 604800);
    expect(store.countFor('u1')).toBe(1);

    await useCase.execute({ refreshToken: 'refresh:u1:jti-1' });

    expect(store.countFor('u1')).toBe(0);
  });

  it('es idempotente con un token inválido/expirado (no lanza)', async () => {
    const { tokens, useCase } = build();
    tokens.failVerify = true;
    await expect(useCase.execute({ refreshToken: 'basura' })).resolves.toBeUndefined();
  });
});
