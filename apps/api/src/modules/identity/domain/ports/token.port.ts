import type { RoleCode } from '../entities/role.entity';

/** Claims del access token (JWT propio): identidad + roles + scope multi-tenant. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: RoleCode[];
  companyId?: string | null;
  localId?: string | null;
  /** Admin obligatorio aún restringido al enrolamiento de MFA. */
  mfaPending?: boolean;
}

/** Token firmado + su TTL en segundos. */
export interface IssuedToken {
  token: string;
  expiresIn: number;
}

export interface EmailChangeClaims {
  sub: string;
  newEmail: string;
}

/**
 * Puerto secundario (ACL): emisión/verificación de JWT. La implementación
 * (@nestjs/jwt) vive en infrastructure. access corto + refresh (§1.1).
 */
export abstract class TokenService {
  abstract signAccess(claims: AccessTokenClaims): Promise<IssuedToken>;
  /**
   * Firma un refresh token portando `jti` (id único de sesión) para permitir
   * rotación y revocación server-side (A2). El caller genera el `jti` y lo
   * persiste en el {@link RefreshTokenStore}.
   */
  abstract signRefresh(userId: string, jti?: string): Promise<IssuedToken>;
  /** Verifica el refresh y devuelve el `sub` + el `jti` de la sesión (A2). */
  abstract verifyRefresh(token: string): Promise<{ sub: string; jti?: string }>;
  abstract signEmailVerification(userId: string): Promise<string>;
  abstract verifyEmailVerification(token: string): Promise<{ sub: string }>;
  abstract signEmailChange(claims: EmailChangeClaims): Promise<string>;
  abstract verifyEmailChange(token: string): Promise<EmailChangeClaims>;
}
