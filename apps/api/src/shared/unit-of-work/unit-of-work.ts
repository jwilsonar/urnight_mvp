import { Injectable } from '@nestjs/common';
import type { Database } from '@urnight/db';
import { DrizzleService } from '../database/drizzle.service';

/** Transacción Drizzle (mismo tipo que `db` dentro de `.transaction`). */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Unit of Work — transaccionalidad por caso de uso (§3.2).
 * commit/rollback atómico: si `work` lanza, la Tx hace rollback.
 */
@Injectable()
export class UnitOfWork {
  constructor(private readonly drizzle: DrizzleService) {}

  run<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.drizzle.db.transaction((tx) => work(tx));
  }
}
