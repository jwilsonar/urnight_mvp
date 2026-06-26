import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { Request } from 'express';
import { REDIS } from '../../shared/redis/redis.module';
import { createLogger } from '../../shared/logging/logger';

/**
 * Rate Limiter (§2.2): ventana fija por IP en Redis. Protege login y checkout.
 * Fail-open: si Redis no responde, deja pasar (no tumba la API por caché caída).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly log = createLogger(RateLimitGuard.name);
  private readonly limit = 100;
  private readonly windowSec = 60;

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip ?? 'unknown';
    const key = `ratelimit:${ip}`;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, this.windowSec);
      if (count > this.limit) {
        this.log.warn({ ip, count, limit: this.limit, path: req.url }, 'ratelimit.exceeded');
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.log.warn({ err: (err as Error).message }, 'ratelimit.fail_open');
    }
    return true;
  }
}
