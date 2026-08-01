import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createLogger } from '../../../../shared/logging/logger';
import { REDIS } from '../../../../shared/redis/redis.module';
import {
  RefreshTokenStore,
  type RefreshRotationResult,
  type RefreshRotationState,
} from '../../domain/ports/refresh-token-store.port';

/** Prefijo de namespace de las claves de sesión de refresh en Redis. */
const NS = 'identity:refresh';
const jtiKey = (userId: string, jti: string): string => `${NS}:${userId}:${jti}`;
const userSetKey = (userId: string): string => `${NS}:user:${userId}`;
const ACTIVE = 'active';
const LEGACY_ACTIVE = '1';
const ROTATING = 'rotating';
const ROTATED_PREFIX = 'rotated:';

const CLAIM_ROTATION_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current then return 'invalid' end
if current == ARGV[1] or current == ARGV[2] then
  redis.call('SET', KEYS[1], ARGV[3], 'EX', ARGV[4])
  return 'claimed'
end
return current
`;
const COMPLETE_ROTATION_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if current == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
  return 1
end
return 0
`;

/**
 * Store de refresh sobre Redis (A2). El estado vive en una clave por-jti
 * (`identity:refresh:<userId>:<jti>`): activa hasta el TTL del refresh y, al rotar,
 * conserva brevemente `rotating` o el par emitido. El índice
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
    await this.redis.set(jtiKey(userId, jti), ACTIVE, 'EX', ttlSeconds);
    try {
      await this.redis.sadd(userSetKey(userId), jti);
      await this.redis.expire(userSetKey(userId), ttlSeconds);
    } catch (err) {
      // Índice best-effort: la validez la garantiza la clave por-jti.
      this.log.warn({ err: (err as Error).message }, 'identity.refresh.index_unavailable');
    }
  }

  async isValid(userId: string, jti: string): Promise<boolean> {
    const value = await this.redis.get(jtiKey(userId, jti));
    return value === ACTIVE || value === LEGACY_ACTIVE;
  }

  async beginRotation(
    userId: string,
    jti: string,
    graceSeconds: number,
  ): Promise<RefreshRotationState> {
    const value = (await this.redis.eval(
      CLAIM_ROTATION_SCRIPT,
      1,
      jtiKey(userId, jti),
      ACTIVE,
      LEGACY_ACTIVE,
      ROTATING,
      String(graceSeconds),
    )) as string;

    if (value === 'claimed' || value === 'invalid') return { status: value };
    if (value === ROTATING) return { status: 'pending' };
    const result = this.parseRotation(value);
    return result ? { status: 'rotated', result } : { status: 'invalid' };
  }

  async completeRotation(
    userId: string,
    jti: string,
    result: RefreshRotationResult,
    graceSeconds: number,
  ): Promise<void> {
    await this.redis.eval(
      COMPLETE_ROTATION_SCRIPT,
      1,
      jtiKey(userId, jti),
      ROTATING,
      `${ROTATED_PREFIX}${JSON.stringify(result)}`,
      String(graceSeconds),
    );
  }

  async getRotation(userId: string, jti: string): Promise<RefreshRotationResult | null> {
    const value = await this.redis.get(jtiKey(userId, jti));
    return value ? this.parseRotation(value) : null;
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

  private parseRotation(value: string): RefreshRotationResult | null {
    if (!value.startsWith(ROTATED_PREFIX)) return null;
    try {
      return JSON.parse(value.slice(ROTATED_PREFIX.length)) as RefreshRotationResult;
    } catch {
      return null;
    }
  }
}
