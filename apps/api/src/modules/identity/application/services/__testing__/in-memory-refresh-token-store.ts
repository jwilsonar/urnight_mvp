import {
  RefreshTokenStore,
  type RefreshRotationResult,
  type RefreshRotationState,
} from '../../../domain/ports/refresh-token-store.port';

/**
 * RefreshTokenStore en memoria para tests unitarios de identity (el fake Redis de
 * shared/testing no es editable desde aquí). Modela clave por-jti + set por-userId.
 */
export class InMemoryRefreshTokenStore extends RefreshTokenStore {
  /** userId → set de jti vivos. */
  private readonly byUser = new Map<string, Set<string>>();
  private readonly rotations = new Map<
    string,
    { expiresAt: number; result: RefreshRotationResult | null }
  >();

  private rotationKey(userId: string, jti: string): string {
    return `${userId}:${jti}`;
  }

  async store(userId: string, jti: string, _ttlSeconds: number): Promise<void> {
    const set = this.byUser.get(userId) ?? new Set<string>();
    set.add(jti);
    this.byUser.set(userId, set);
  }

  async isValid(userId: string, jti: string): Promise<boolean> {
    return this.byUser.get(userId)?.has(jti) ?? false;
  }

  async beginRotation(
    userId: string,
    jti: string,
    graceSeconds: number,
  ): Promise<RefreshRotationState> {
    const key = this.rotationKey(userId, jti);
    const rotation = this.rotations.get(key);
    if (rotation && rotation.expiresAt <= Date.now()) this.rotations.delete(key);
    else if (rotation?.result) return { status: 'rotated', result: rotation.result };
    else if (rotation) return { status: 'pending' };

    if (!(this.byUser.get(userId)?.has(jti) ?? false)) return { status: 'invalid' };
    this.byUser.get(userId)?.delete(jti);
    this.rotations.set(key, {
      expiresAt: Date.now() + graceSeconds * 1000,
      result: null,
    });
    return { status: 'claimed' };
  }

  async completeRotation(
    userId: string,
    jti: string,
    result: RefreshRotationResult,
    graceSeconds: number,
  ): Promise<void> {
    const key = this.rotationKey(userId, jti);
    const current = this.rotations.get(key);
    if (!current || current.result || current.expiresAt <= Date.now()) return;
    this.rotations.set(key, {
      expiresAt: Date.now() + graceSeconds * 1000,
      result,
    });
  }

  async getRotation(userId: string, jti: string): Promise<RefreshRotationResult | null> {
    const key = this.rotationKey(userId, jti);
    const rotation = this.rotations.get(key);
    if (!rotation || rotation.expiresAt <= Date.now()) {
      this.rotations.delete(key);
      return null;
    }
    return rotation.result;
  }

  async revoke(userId: string, jti: string): Promise<void> {
    this.byUser.get(userId)?.delete(jti);
    this.rotations.delete(this.rotationKey(userId, jti));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    this.byUser.delete(userId);
    for (const key of this.rotations.keys()) {
      if (key.startsWith(`${userId}:`)) this.rotations.delete(key);
    }
  }

  /** Nº de jti vivos de un usuario (aserciones de test). */
  countFor(userId: string): number {
    return this.byUser.get(userId)?.size ?? 0;
  }

  /** Fuerza el fin de la gracia sin esperar tiempo real. */
  expireRotations(): void {
    for (const rotation of this.rotations.values()) rotation.expiresAt = 0;
  }
}
