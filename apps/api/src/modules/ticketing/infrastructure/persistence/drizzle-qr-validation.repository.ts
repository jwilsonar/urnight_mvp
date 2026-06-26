import { Inject, Injectable } from '@nestjs/common';
import { qrValidation } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import type {
  QrValidationRecord,
  QrValidationRepository,
} from '../../domain/ports/qr-validation.repository';

@Injectable()
export class DrizzleQrValidationRepository implements QrValidationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async create(record: QrValidationRecord, tx?: unknown): Promise<void> {
    await this.exec(tx)
      .insert(qrValidation)
      .values({
        id: record.id,
        ticketId: record.ticketId,
        eventId: record.eventId,
        localId: record.localId,
        validatedBy: record.validatedBy,
        result: record.result,
        method: record.method,
        deviceInfo: record.deviceInfo,
      });
  }
}
