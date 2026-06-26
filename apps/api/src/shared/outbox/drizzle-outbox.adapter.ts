import { Inject, Injectable } from '@nestjs/common';
import { outbox } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../database/drizzle.constants';
import type { Tx } from '../unit-of-work/unit-of-work';
import { OutboxPort, type OutboxJob } from './outbox.port';

/**
 * Adapter real del Outbox (§3.2): inserta el job en la tabla `outbox`. Si se
 * pasa `tx`, la inserción participa en la Tx del caso de uso (garantía
 * transaccional). El relay del worker lo drena hacia BullMQ.
 */
@Injectable()
export class DrizzleOutboxAdapter extends OutboxPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {
    super();
  }

  async enqueue<T>(job: OutboxJob<T>, tx?: unknown): Promise<void> {
    const exec = (tx as Tx | undefined) ?? this.db;
    await exec.insert(outbox).values({
      queue: job.queue,
      name: job.name,
      payload: job.data,
    });
  }
}
