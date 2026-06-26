import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDbClient, type Database } from '@urnight/db';
import type { Env } from '../config/env.schema';

/** Token del cliente Drizzle del worker (drena la tabla outbox). */
export const DB = Symbol('DB');

/** Conexión Drizzle del worker (§7). Reusa la factory única de @urnight/db. */
@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Database =>
        createDbClient(config.getOrThrow('DATABASE_URL', { infer: true })).db,
    },
  ],
  exports: [DB],
})
export class DbModule {}
