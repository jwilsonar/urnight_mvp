import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createLogger } from '../../../../shared/logging/logger';
import { REDIS } from '../../../../shared/redis/redis.module';
import { RefreshTokenStore } from '../../domain/ports/refresh-token-store.port';

/** Prefijo de namespace de las claves de sesión de refresh en Redis. */
const NS = 'identity:refresh';
const jtiKey = (userId: string, jti: string): string => `${NS}:${userId}:${jti}`;
const userSetKey = (userId: string): string => `${NS}:user:${userId}`;

/**
 * Store de refresh sobre Redis (A2). La validez real vive en una clave por-jti
 * (`identity:refresh:<userId>:<jti>`), que expira con el refresh (TTL). El índice
 * por-usuario (`identity:refresh:user:<userId>`, un SET de jti) es best-effort y
 * solo habilita la revocación en masa; si el cliente Redis inyectado no soporta
 * comandos de SET (dobles de test), degrada sin romper el login.
 */
@Injectable()
export class RedisRefreshTokenStore extends RefreshTokenStore {
  private readonly log = createLogger(RedisRefreshTokenStore.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {
    super();
  }

  async store(userId: string, jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(jtiKey(userId, jti), '1', 'EX', ttlSeconds);
    try {
      await this.redis.sadd(userSetKey(userId), jti);
      await this.redis.expire(userSetKey(userId), ttlSeconds);
    } catch (err) {
      // Índice best-effort: la validez la garantiza la clave por-jti.
      this.log.warn({ err: (err as Error).message }, 'identity.refresh.index_unavailable');
    }
  }

  async isValid(userId: string, jti: string): Promise<boolean> {
    return (await this.redis.get(jtiKey(userId, jti))) !== null;
  }

  async revoke(userId: string, jti: string): Promise<void> {
    await this.redis.del(jtiKey(userId, jti));
    try {
      await this.redis.srem(userSetKey(userId), jti);
    } catch (err) {
      this.log.warn({ err: (err as Error).message }, 'identity.refresh.index_unavailable');
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    try {
      const jtis = await this.redis.smembers(userSetKey(userId));
      if (jtis.length > 0) {
        await this.redis.del(...jtis.map((jti) => jtiKey(userId, jti)));
      }
      await this.redis.del(userSetKey(userId));
      this.log.info({ userId, revoked: jtis.length }, 'identity.refresh.revoked_all');
    } catch (err) {
      this.log.warn({ err: (err as Error).message }, 'identity.refresh.revoke_all_failed');
    }
  }
}
