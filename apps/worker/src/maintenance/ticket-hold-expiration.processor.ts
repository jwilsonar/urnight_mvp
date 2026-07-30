import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { UnrecoverableError, type Job } from 'bullmq';
import { and, eq, lte } from 'drizzle-orm';
import { ticketHold, type Database } from '@urnight/db';
import { DB } from '../db/db.module';
import { createLogger } from '../logging/logger';

/** Limpieza activa complementaria a la expiración perezosa de disponibilidad. */
@Processor('maintenance')
export class TicketHoldExpirationProcessor extends WorkerHost {
  private readonly log = createLogger(TicketHoldExpirationProcessor.name);

  constructor(@Inject(DB) private readonly db: Database) {
    super();
  }

  async process(job: Job): Promise<{ expired: number }> {
    if (job.name !== 'expire-ticket-holds') {
      throw new UnrecoverableError(`Job de mantenimiento desconocido: ${job.name}`);
    }
    const now = new Date();
    const expired = await this.db
      .update(ticketHold)
      .set({ status: 'expired', updatedAt: now })
      .where(
        and(
          eq(ticketHold.status, 'active'),
          lte(ticketHold.expiresAt, now),
        ),
      )
      .returning({ id: ticketHold.id });
    this.log.info(
      { expired: expired.length },
      'worker.ticket_holds.expired',
    );
    return { expired: expired.length };
  }
}
