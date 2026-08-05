import { randomBytes } from 'node:crypto';

const RECOVERY_CODE_COUNT = 10;

/** Códigos de alta entropía legibles, sin persistencia en texto plano. */
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const compact = randomBytes(10).toString('hex').toUpperCase();
    return compact.match(/.{1,5}/g)?.join('-') ?? compact;
  });
}
