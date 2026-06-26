import { Global, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../../config/env.schema';

/** Token de inyección del cliente Redis (ioredis). */
export const REDIS = Symbol('REDIS');

const logger = new Logger('RedisModule');

/** Cliente Redis compartido (sesiones, rate-limit, lock de stock, BullMQ). */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService<Env, true>): Redis => {
        const client = new Redis(config.getOrThrow('REDIS_URL', { infer: true }), {
          maxRetriesPerRequest: null,
          lazyConnect: false,
        });
        client.on('error', (err) => logger.warn(`Redis: ${err.message}`));
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // El cliente se cierra con el proceso; ioredis no bloquea el exit.
  }
}
