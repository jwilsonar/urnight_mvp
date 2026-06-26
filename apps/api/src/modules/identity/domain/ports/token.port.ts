import type { RoleCode } from '../entities/role.entity';

/** Claims del access token (JWT propio): identidad + roles + scope multi-tenant. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: RoleCode[];
  companyId?: string | null;
  localId?: string | null;
}

/** Token firmado + su TTL en segundos. */
export interface IssuedToken {
  token: string;
  expiresIn: number;
}

/**
 * Puerto secundario (ACL): emisión/verificación de JWT. La implementación
 * (@nestjs/jwt) vive en infrastructure. access corto + refresh (§1.1).
 */
export abstract class TokenService {
  abstract signAccess(claims: AccessTokenClaims): Promise<IssuedToken>;
  abstract signRefresh(userId: string): Promise<IssuedToken>;
  abstract verifyRefresh(token: string): Promise<{ sub: string }>;
  abstract signEmailVerification(userId: string): Promise<string>;
  abstract verifyEmailVerification(token: string): Promise<{ sub: string }>;
}
