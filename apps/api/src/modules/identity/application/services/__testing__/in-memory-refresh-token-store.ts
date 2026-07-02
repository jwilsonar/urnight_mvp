import { RefreshTokenStore } from '../../../domain/ports/refresh-token-store.port';

/**
 * RefreshTokenStore en memoria para tests unitarios de identity (el fake Redis de
 * shared/testing no es editable desde aquí). Modela clave por-jti + set por-userId.
 */
export class InMemoryRefreshTokenStore extends RefreshTokenStore {
  /** userId → set de jti vivos. */
  private readonly byUser = new Map<string, Set<string>>();

  async store(userId: string, jti: string, _ttlSeconds: number): Promise<void> {
    const set = this.byUser.get(userId) ?? new Set<string>();
    set.add(jti);
    this.byUser.set(userId, set);
  }

  async isValid(userId: string, jti: string): Promise<boolean> {
    return this.byUser.get(userId)?.has(jti) ?? false;
  }

  async revoke(userId: string, jti: string): Promise<void> {
    this.byUser.get(userId)?.delete(jti);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    this.byUser.delete(userId);
  }

  /** Nº de jti vivos de un usuario (aserciones de test). */
  countFor(userId: string): number {
    return this.byUser.get(userId)?.size ?? 0;
  }
}
