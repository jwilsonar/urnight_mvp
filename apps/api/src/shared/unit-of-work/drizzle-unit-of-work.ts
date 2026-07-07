import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { UnitOfWork, type Tx } from './unit-of-work';

/** Adapter Drizzle del puerto UnitOfWork (§3.2). */
@Injectable()
export class DrizzleUnitOfWork extends UnitOfWork {
  constructor(private readonly drizzle: DrizzleService) {
    super();
  }

  run<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.drizzle.db.transaction((tx) => work(tx));
  }
}
