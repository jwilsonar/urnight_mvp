import type { TotpPort } from '../../../domain/ports/totp.port';

export class FakeTotp implements TotpPort {
  readonly secret = 'JBSWY3DPEHPK3PXP';
  readonly validCode = '123456';

  generateSecret(): string {
    return this.secret;
  }

  buildOtpAuthUri(secret: string, accountLabel: string): string {
    return `otpauth://totp/RAVENUE:${encodeURIComponent(accountLabel)}?secret=${secret}`;
  }

  verify(secret: string, code: string): boolean {
    return secret === this.secret && code === this.validCode;
  }
}
