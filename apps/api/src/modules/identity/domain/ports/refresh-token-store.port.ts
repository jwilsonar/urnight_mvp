import type { RoleCode } from '../entities/role.entity';
import type { IssuedToken } from './token.port';

export interface RefreshRotationResult {
  roleCodes: RoleCode[];
  access: IssuedToken;
  refresh: IssuedToken;
}

export type RefreshRotationState =
  | { status: 'claimed' | 'pending' | 'invalid' }
  | { status: 'rotated'; result: RefreshRotationResult };

/**
 * Puerto secundario (ACL): store de sesiones de refresh para rotación + revocación
 * (A2). La implementación (Redis) vive en infrastructure. Modelo:
 *   - clave por-jti  → fuente de verdad de validez (isValid/revoke).
 *   - set por-userId → permite revocar en masa (cambio de password / desactivación).
 * El refresh JWT solo es válido si su `jti` sigue vivo en el store; al rotarlo se
 * conserva brevemente el resultado idempotente. Un `jti` ausente ⇒ posible reuso/robo.
 */
export abstract class RefreshTokenStore {
  /** Registra un `jti` válido para `userId` con TTL = expiración del refresh (segundos). */
  abstract store(userId: string, jti: string, ttlSeconds: number): Promise<void>;
  /** ¿El `jti` sigue vivo (no rotado ni revocado) para `userId`? */
  abstract isValid(userId: string, jti: string): Promise<boolean>;
  /** Reclama atómicamente la rotación o recupera su resultado dentro de la gracia. */
  abstract beginRotation(
    userId: string,
    jti: string,
    graceSeconds: number,
  ): Promise<RefreshRotationState>;
  /** Guarda el par de la rotación ganadora durante la ventana de gracia. */
  abstract completeRotation(
    userId: string,
    jti: string,
    result: RefreshRotationResult,
    graceSeconds: number,
  ): Promise<void>;
  /** Recupera un par emitido; null significa pendiente, vencido o inexistente. */
  abstract getRotation(userId: string, jti: string): Promise<RefreshRotationResult | null>;
  /** Revoca un `jti` concreto (rotación de un solo uso / logout). */
  abstract revoke(userId: string, jti: string): Promise<void>;
  /** Revoca TODOS los refresh de `userId` (cambio de password / desactivación de cuenta). */
  abstract revokeAllForUser(userId: string): Promise<void>;
}
