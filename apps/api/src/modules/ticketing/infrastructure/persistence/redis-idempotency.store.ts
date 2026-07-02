import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../../../../shared/redis/redis.module';
import { createLogger } from '../../../../shared/logging/logger';
import type { IdempotencyStore } from '../../domain/ports/idempotency.port';

/** TTL de una clave de idempotencia (24h): cubre reintentos razonables del cliente. */
const IDEMPOTENCY_TTL_S = 24 * 60 * 60;

/**
 * Store de idempotencia sobre Redis (M3). Persiste `key → orderId` por usuario
 * con TTL. `SET NX` da la semántica de "primer escritor gana" que, junto al lock
 * por clave del use-case, deduplica el checkout sin tabla ni migración.
 */
@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly log = createLogger(RedisIdempotencyStore.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private keyOf(userId: string, key: string): string {
    return `idempotency:checkout:${userId}:${key}`;
  }

  async recall(userId: string, key: string): Promise<string | null> {
    return this.redis.get(this.keyOf(userId, key));
  }

  async remember(userId: string, key: string, orderId: string): Promise<void> {
    // NX: no sobrescribe una asociación previa (la primera orden es la buena).
    await this.redis.set(this.keyOf(userId, key), orderId, 'EX', IDEMPOTENCY_TTL_S, 'NX');
    this.log.debug({ userId, orderId }, 'ticketing.checkout.idempotency_stored');
  }
}
