import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { Env } from '../config/env.schema';
import { createLogger } from '../logging/logger';

const SCHEDULER_ID = 'ticket-holds-expiration';
const VERIFICATION_SCHEDULER_ID = 'local-verification-maintenance';

/** Registra un job periódico BullMQ; es idempotente entre reinicios del worker. */
@Injectable()
export class MaintenanceScheduler implements OnApplicationBootstrap {
  private readonly log = createLogger(MaintenanceScheduler.name);

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
    const verificationEvery =
      this.config.get('LOCAL_VERIFICATION_MAINTENANCE_INTERVAL_SECONDS', {
        infer: true,
      }) * 1000;
    await this.queue.upsertJobScheduler(
      VERIFICATION_SCHEDULER_ID,
      { every: verificationEvery },
      { name: 'maintain-local-verifications', data: {} },
    );
    this.log.info({ every }, 'worker.ticket_holds.scheduler_ready');
    this.log.info(
      { every: verificationEvery },
      'worker.local_verifications.scheduler_ready',
    );
  }
}
