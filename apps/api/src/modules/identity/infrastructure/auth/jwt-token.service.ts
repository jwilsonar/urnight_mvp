import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Env } from '../../../../config/env.schema';
import { createLogger } from '../../../../shared/logging/logger';
import { InvalidTokenError } from '../../domain/errors/identity.errors';
import {
  TokenService,
  type AccessTokenClaims,
  type IssuedToken,
} from '../../domain/ports/token.port';

/** TTL del token de verificación de email (24h, en segundos). */
const EMAIL_VERIFY_TTL = 60 * 60 * 24;

type RawClaims = { sub?: string; type?: string; purpose?: string };

/**
 * Adapter @nestjs/jwt del puerto TokenService (ACL). El access usa el secreto +
 * TTL por defecto del JwtModule; el refresh y el de email firman con secreto/TTL
 * propios. JWT propio: access corto + refresh (§1.1).
 */
@Injectable()
export class JwtTokenService extends TokenService {
  private readonly log = createLogger(JwtTokenService.name);
  private readonly accessTtl: number;
  private readonly refreshSecret: string;
  private readonly refreshTtl: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Env, true>,
  ) {
    super();
    this.accessTtl = config.getOrThrow('JWT_ACCESS_TTL', { infer: true });
    this.refreshSecret = config.getOrThrow('JWT_REFRESH_SECRET', { infer: true });
    this.refreshTtl = config.getOrThrow('JWT_REFRESH_TTL', { infer: true });
  }

  async signAccess(claims: AccessTokenClaims): Promise<IssuedToken> {
    const token = await this.jwt.signAsync(
      {
        email: claims.email,
        roles: claims.roles,
        companyId: claims.companyId ?? null,
        localId: claims.localId ?? null,
      },
      { subject: claims.sub },
    );
    return { token, expiresIn: this.accessTtl };
  }

  async signRefresh(userId: string): Promise<IssuedToken> {
    const token = await this.jwt.signAsync(
      { type: 'refresh' },
      { subject: userId, secret: this.refreshSecret, expiresIn: this.refreshTtl },
    );
    return { token, expiresIn: this.refreshTtl };
  }

  async verifyRefresh(token: string): Promise<{ sub: string }> {
    try {
      const claims = await this.jwt.verifyAsync<RawClaims>(token, { secret: this.refreshSecret });
      if (claims.type !== 'refresh' || !claims.sub) throw new Error('claims inválidos');
      return { sub: claims.sub };
    } catch {
      this.log.warn({}, 'token.refresh.invalid');
      throw new InvalidTokenError();
    }
  }

  signEmailVerification(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { purpose: 'email_verify' },
      { subject: userId, expiresIn: EMAIL_VERIFY_TTL },
    );
  }

  async verifyEmailVerification(token: string): Promise<{ sub: string }> {
    try {
      const claims = await this.jwt.verifyAsync<RawClaims>(token);
      if (claims.purpose !== 'email_verify' || !claims.sub) throw new Error('claims inválidos');
      return { sub: claims.sub };
    } catch {
      this.log.warn({}, 'token.email_verify.invalid');
      throw new InvalidTokenError();
    }
  }
}
