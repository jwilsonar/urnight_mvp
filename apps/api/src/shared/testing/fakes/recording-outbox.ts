import { OutboxPort, type OutboxJob } from '../../outbox/outbox.port';

/** OutboxPort que captura los jobs encolados para verificarlos en los tests. */
export class RecordingOutbox extends OutboxPort {
  readonly jobs: OutboxJob[] = [];

  async enqueue<T>(job: OutboxJob<T>, _tx?: unknown): Promise<void> {
    this.jobs.push(job);
  }

  /** Primer job encolado con un `name` dado (o undefined). */
  byName(name: string): OutboxJob | undefined {
    return this.jobs.find((j) => j.name === name);
  }
}
