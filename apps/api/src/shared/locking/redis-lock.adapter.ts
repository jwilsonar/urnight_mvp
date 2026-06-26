import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { createLogger } from '../logging/logger';
import { LockPort, LockUnavailableError } from './lock.port';

/** Release seguro: solo borra si el token coincide (evita borrar lock ajeno). */
const RELEASE_LUA =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

/** Lock distribuido con Redis (SET NX PX + release con token). */
@Injectable()
export class RedisLockAdapter extends LockPort {
  private readonly log = createLogger(RedisLockAdapter.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {
    super();
  }

  async withLock<T>(key: string, ttlMs: number, work: () => Promise<T>): Promise<T> {
    const lockKey = `lock:${key}`;
    const token = randomUUID();
    const acquired = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');
    if (!acquired) {
      this.log.warn({ key, ttlMs }, 'lock.unavailable');
      throw new LockUnavailableError();
    }
    this.log.debug({ key, ttlMs }, 'lock.acquired');
    try {
      return await work();
    } finally {
      await this.redis.eval(RELEASE_LUA, 1, lockKey, token).catch(() => undefined);
      this.log.debug({ key }, 'lock.released');
    }
  }
}
