import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { asc, eq } from 'drizzle-orm';
import { outbox, type Database } from '@urnight/db';
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

  constructor(
    @Inject(DB) private readonly db: Database,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

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
          await this.queue.add(row.name, row.payload, { jobId: row.id });
          await this.db
            .update(outbox)
            .set({ status: 'done', processedAt: new Date() })
            .where(eq(outbox.id, row.id));
        } catch (err) {
          await this.db
            .update(outbox)
            .set({ attempts: row.attempts + 1, lastError: (err as Error).message })
            .where(eq(outbox.id, row.id));
          this.log.error({ id: row.id, err }, 'worker.outbox.relay_failed');
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
