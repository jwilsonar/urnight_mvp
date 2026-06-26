import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import { Public } from '../edge/decorators/public.decorator';
import { DRIZZLE, type DrizzleDb } from '../shared/database/drizzle.constants';
import { REDIS } from '../shared/redis/redis.module';

type Status = 'up' | 'down';

/** GET /api/v1/health — liveness/readiness (DB + Redis). Público. */
@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.all([this.pingDb(), this.pingRedis()]);
    const ok = database === 'up' && redis === 'up';
    const body = {
      status: ok ? 'ok' : 'error',
      info: { database: { status: database }, redis: { status: redis } },
    };
    if (!ok) throw new ServiceUnavailableException(body);
    return body;
  }

  private async pingDb(): Promise<Status> {
    try {
      await this.db.execute(sql`select 1`);
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<Status> {
    try {
      return (await this.redis.ping()) === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
