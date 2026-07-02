/**
 * Puerto secundario (ACL): store de sesiones de refresh para rotación + revocación
 * (A2). La implementación (Redis) vive en infrastructure. Modelo:
 *   - clave por-jti  → fuente de verdad de validez (isValid/revoke).
 *   - set por-userId → permite revocar en masa (cambio de password / desactivación).
 * El refresh JWT solo es válido si su `jti` sigue vivo en el store; en cada refresh
 * se rota (borra el viejo, guarda uno nuevo). Un `jti` ausente ⇒ posible reuso/robo.
 */
export abstract class RefreshTokenStore {
  /** Registra un `jti` válido para `userId` con TTL = expiración del refresh (segundos). */
  abstract store(userId: string, jti: string, ttlSeconds: number): Promise<void>;
  /** ¿El `jti` sigue vivo (no rotado ni revocado) para `userId`? */
  abstract isValid(userId: string, jti: string): Promise<boolean>;
  /** Revoca un `jti` concreto (rotación de un solo uso / logout). */
  abstract revoke(userId: string, jti: string): Promise<void>;
  /** Revoca TODOS los refresh de `userId` (cambio de password / desactivación de cuenta). */
  abstract revokeAllForUser(userId: string): Promise<void>;
}
