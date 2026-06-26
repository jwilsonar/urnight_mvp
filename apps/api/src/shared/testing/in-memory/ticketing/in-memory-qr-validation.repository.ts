import type {
  QrValidationRecord,
  QrValidationRepository,
} from '../../../../modules/ticketing/domain/ports/qr-validation.repository';

/** QrValidationRepository en memoria. Registra cada intento de validación. */
export class InMemoryQrValidationRepository implements QrValidationRepository {
  readonly records: QrValidationRecord[] = [];

  async create(record: QrValidationRecord, _tx?: unknown): Promise<void> {
    this.records.push(record);
  }

  get size(): number {
    return this.records.length;
  }

  /** Último registro creado (o undefined). */
  last(): QrValidationRecord | undefined {
    return this.records[this.records.length - 1];
  }
}
