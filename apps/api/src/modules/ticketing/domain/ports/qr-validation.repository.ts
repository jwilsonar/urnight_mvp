import type { ValidationResult } from '../entities/ticket.entity';

export interface QrValidationRecord {
  id: string;
  ticketId: string;
  eventId: string;
  localId: string | null;
  validatedBy: string | null;
  result: ValidationResult;
  method: string;
  deviceInfo: string | null;
}

export interface QrValidationRepository {
  create(record: QrValidationRecord, tx?: unknown): Promise<void>;
}

export const QR_VALIDATION_REPOSITORY = Symbol('QR_VALIDATION_REPOSITORY');
