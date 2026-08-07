import {
  TokenService,
  type AccessTokenClaims,
  type IssuedToken,
} from '../../../modules/identity/domain/ports/token.port';
import { InvalidTokenError } from '../../../modules/identity/domain/errors/identity.errors';

/**
 * TokenService determinista. Los tokens codifican el `sub` (`refresh:<id>`,
 * `verify:<id>`) para que verify() haga round-trip y el caso de uso resuelva el
 * usuario. `failVerify` fuerza el fallo de verificación (token criptográficamente
 * inválido) en los tests que lo necesiten.
 */
export class FakeTokenService extends TokenService {
  failVerify = false;
  emailChangeExpired = false;
  accessClaims: AccessTokenClaims[] = [];
  private readonly emailChanges = new Map<string, { sub: string; newEmail: string }>();

  async signAccess(claims: AccessTokenClaims): Promise<IssuedToken> {
    this.accessClaims.push(claims);
    return { token: `access:${claims.sub}`, expiresIn: 900 };
  }

  async signRefresh(userId: string): Promise<IssuedToken> {
    return { token: `refresh:${userId}`, expiresIn: 604800 };
  }

  async verifyRefresh(token: string): Promise<{ sub: string }> {
    if (this.failVerify) throw new Error('FakeTokenService: refresh token inválido');
    return { sub: this.decode(token, 'refresh') };
  }

  async signEmailVerification(userId: string): Promise<string> {
    return `verify:${userId}`;
  }

  async verifyEmailVerification(token: string): Promise<{ sub: string }> {
    if (this.failVerify) throw new Error('FakeTokenService: token de verificación inválido');
    return { sub: this.decode(token, 'verify') };
  }

  async signEmailChange(input: { sub: string; newEmail: string }): Promise<string> {
    const token = `email-change:${this.emailChanges.size + 1}`;
    this.emailChanges.set(token, input);
    return token;
  }

  async verifyEmailChange(token: string): Promise<{ sub: string; newEmail: string }> {
    const claims = this.emailChanges.get(token);
    if (this.emailChangeExpired || !claims) throw new InvalidTokenError();
    return claims;
  }

  private decode(token: string, prefix: string): string {
    const marker = `${prefix}:`;
    return token.startsWith(marker) ? token.slice(marker.length) : token;
  }
}
