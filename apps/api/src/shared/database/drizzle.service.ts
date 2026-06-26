import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDbClient, type Database, type Sql } from '@urnight/db';
import type { Env } from '../../config/env.schema';

/**
 * Posee el cliente postgres.js + Drizzle y lo cierra de forma ordenada
 * en el shutdown (Anti-corruption / ciclo de vida del recurso).
 */
@Injectable()
export class DrizzleService implements OnApplicationShutdown {
  private readonly logger = new Logger(DrizzleService.name);
  readonly db: Database;
  readonly sql: Sql;

  constructor(config: ConfigService<Env, true>) {
    const url = config.getOrThrow('DATABASE_URL', { infer: true });
    const client = createDbClient(url);
    this.db = client.db;
    this.sql = client.sql;
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Cerrando pool de PostgreSQL…');
    await this.sql.end({ timeout: 5 });
  }
}
