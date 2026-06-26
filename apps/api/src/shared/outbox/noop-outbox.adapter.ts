import { Injectable } from '@nestjs/common';
import { createLogger } from '../logging/logger';
import { OutboxPort, type OutboxJob } from './outbox.port';

/**
 * Stub Fase 1: registra el job en lugar de encolarlo. Se reemplaza por el
 * adapter BullMQ real cuando se conecte el worker (sin tocar los casos de uso).
 */
@Injectable()
export class NoopOutboxAdapter extends OutboxPort {
  private readonly log = createLogger(NoopOutboxAdapter.name);

  async enqueue<T>(job: OutboxJob<T>): Promise<void> {
    this.log.debug({ queue: job.queue, name: job.name }, 'outbox.enqueue');
  }
}
