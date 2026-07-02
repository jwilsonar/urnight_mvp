import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { asc, eq } from 'drizzle-orm';
import { outbox, type Database } from '@urnight/db';
import type { Env } from '../config/env.schema';
import { DB } from '../db/db.module';
import { createLogger } from '../logging/logger';

const POLL_MS = 2_000;
const BATCH = 20;

/**
 * Relay del Outbox (§3.2): drena las filas 'pending' de la tabla `outbox` y las
 * encola en BullMQ con `jobId = outbox.id` (idempotente). Marca la fila 'done'.
 * Cierra el lazo Outbox → BullMQ → processors. Un solo worker en el MVP.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly log = createLogger(OutboxRelay.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  /** A4: tras N intentos fallidos de encolado, la fila se marca 'failed' y sale del poll. */
  private readonly maxAttempts: number;

  constructor(
    @Inject(DB) private readonly db: Database,
    @InjectQueue('notifications') private readonly queue: Queue,
    config: ConfigService<Env, true>,
  ) {
    this.maxAttempts = config.get('OUTBOX_MAX_ATTEMPTS', { infer: true }) ?? 10;
  }

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.drain(), POLL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.db
        .select()
        .from(outbox)
        .where(eq(outbox.status, 'pending'))
        .orderBy(asc(outbox.availableAt))
        .limit(BATCH);

      for (const row of rows) {
        try {
          // `jobId = outbox.id` => idempotente. attempts/backoff/removeOn* vienen
          // de `defaultJobOptions` del registerQueue (A4): no se pasan aquí.
          await this.queue.add(row.name, row.payload, { jobId: row.id });
          await this.db
            .update(outbox)
            .set({ status: 'done', processedAt: new Date() })
            .where(eq(outbox.id, row.id));
        } catch (err) {
          // A4 parte 2 — fila envenenada: si el encolado falla repetidamente, tras
          // `maxAttempts` la marcamos 'failed' (estado del CHECK hoy sin uso) para
          // sacarla del poll y evitar el loop infinito cada 2s.
          const attempts = row.attempts + 1;
          const poisoned = attempts >= this.maxAttempts;
          await this.db
            .update(outbox)
            .set({
              attempts,
              lastError: (err as Error).message,
              ...(poisoned ? { status: 'failed' as const, processedAt: new Date() } : {}),
            })
            .where(eq(outbox.id, row.id));
          this.log.error(
            { id: row.id, attempts, poisoned, err },
            poisoned ? 'worker.outbox.relay_poisoned' : 'worker.outbox.relay_failed',
          );
        }
      }
      if (rows.length > 0) this.log.info({ count: rows.length }, 'worker.outbox.relayed');
    } catch (err) {
      this.log.error({ err }, 'worker.outbox.drain_failed');
    } finally {
      this.running = false;
    }
  }
}
