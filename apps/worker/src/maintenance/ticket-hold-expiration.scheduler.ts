import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { Env } from '../config/env.schema';
import { createLogger } from '../logging/logger';

const SCHEDULER_ID = 'ticket-holds-expiration';

/** Registra un job periódico BullMQ; es idempotente entre reinicios del worker. */
@Injectable()
export class TicketHoldExpirationScheduler implements OnApplicationBootstrap {
  private readonly log = createLogger(TicketHoldExpirationScheduler.name);

  constructor(
    @InjectQueue('maintenance') private readonly queue: Queue,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const every =
      this.config.get('TICKET_HOLD_CLEANUP_INTERVAL_SECONDS', {
        infer: true,
      }) * 1000;
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { every },
      { name: 'expire-ticket-holds', data: {} },
    );
    this.log.info({ every }, 'worker.ticket_holds.scheduler_ready');
  }
}
