import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { platformSetting } from '@urnight/db';
import {
  LOCAL_DOCUMENT_TYPES,
  type LocalDocumentType,
} from '@urnight/contracts';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import type {
  VerificationPolicy,
  VerificationPolicyPort,
} from '../../domain/ports/verification-policy.port';

const DEFAULT_REQUIRED_TYPES: LocalDocumentType[] = [
  'municipal_license',
  'itse_certificate',
];
const DEFAULT_WARNING_DAYS = 30;

@Injectable()
export class DrizzleVerificationPolicyAdapter implements VerificationPolicyPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async getPolicy(): Promise<VerificationPolicy> {
    const rows = await this.db
      .select({ key: platformSetting.key, value: platformSetting.value })
      .from(platformSetting)
      .where(
        eq(platformSetting.key, 'verification_required_document_types'),
      );
    const warningRows = await this.db
      .select({ value: platformSetting.value })
      .from(platformSetting)
      .where(eq(platformSetting.key, 'verification_expiry_warning_days'))
      .limit(1);

    return {
      requiredDocumentTypes: parseRequiredTypes(rows[0]?.value),
      expiryWarningDays: parseWarningDays(warningRows[0]?.value),
    };
  }
}

function parseRequiredTypes(value?: string): LocalDocumentType[] {
  if (!value) return [...DEFAULT_REQUIRED_TYPES];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...DEFAULT_REQUIRED_TYPES];
    const valid = parsed.filter(
      (item): item is LocalDocumentType =>
        typeof item === 'string' &&
        item !== 'other' &&
        (LOCAL_DOCUMENT_TYPES as readonly string[]).includes(item),
    );
    return valid.length > 0 ? [...new Set(valid)] : [...DEFAULT_REQUIRED_TYPES];
  } catch {
    return [...DEFAULT_REQUIRED_TYPES];
  }
}

function parseWarningDays(value?: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 180
    ? parsed
    : DEFAULT_WARNING_DAYS;
}
