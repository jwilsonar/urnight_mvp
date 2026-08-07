export type OtpCodeConsumeResult = 'consumed' | 'invalid' | 'expired';

/** Store efimero de codigos OTP hasheados y sus limites de uso. */
export interface OtpCodeStore {
  issue(key: string, codeHash: string, ttlSeconds: number): Promise<boolean>;
  consume(key: string, codeHash: string): Promise<OtpCodeConsumeResult>;
  attempts(key: string): Promise<number>;
  lastIssuedAt(key: string): Promise<Date | null>;
}

export const OTP_CODE_STORE = Symbol('OTP_CODE_STORE');
