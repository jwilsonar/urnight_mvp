import type {
  OtpCodeConsumeResult,
  OtpCodeStore,
} from '../../../../modules/identity/domain/ports/otp-code.store';

interface StoredOtp {
  codeHash: string;
  expiresAt: number;
  issuedAt: number;
  attempts: number;
  valid: boolean;
}

/** Replica en memoria el TTL, cooldown de 60 s y bloqueo al sexto fallo. */
export class InMemoryOtpCodeStore implements OtpCodeStore {
  private readonly values = new Map<string, StoredOtp>();

  async issue(key: string, codeHash: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    const current = this.values.get(key);
    if (current && current.issuedAt + 60_000 > now) return false;
    this.values.set(key, {
      codeHash,
      expiresAt: now + ttlSeconds * 1000,
      issuedAt: now,
      attempts: 0,
      valid: true,
    });
    return true;
  }

  async consume(key: string, codeHash: string): Promise<OtpCodeConsumeResult> {
    const stored = this.values.get(key);
    if (!stored || !stored.valid || stored.expiresAt <= Date.now()) return 'expired';
    if (stored.codeHash === codeHash) {
      stored.valid = false;
      return 'consumed';
    }
    stored.attempts += 1;
    if (stored.attempts >= 6) stored.valid = false;
    return 'invalid';
  }

  async attempts(key: string): Promise<number> {
    return this.values.get(key)?.attempts ?? 0;
  }

  async lastIssuedAt(key: string): Promise<Date | null> {
    const stored = this.values.get(key);
    return stored ? new Date(stored.issuedAt) : null;
  }
}
