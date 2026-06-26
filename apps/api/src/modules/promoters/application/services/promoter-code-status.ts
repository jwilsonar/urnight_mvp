import type { RedemptionCodeStatus } from '@urnight/contracts';

/**
 * Estado derivado de un código de canje (no se persiste): `revoked` si está
 * inactivo, `expired` si venció, `redeemed` si agotó su cupo, `active` si aún sirve.
 */
export function deriveRedemptionCodeStatus(
  c: { isActive: boolean; validUntil: Date | null; usageQuota: number | null; usedCount: number },
  now: Date = new Date(),
): RedemptionCodeStatus {
  if (!c.isActive) return 'revoked';
  if (c.validUntil && now > c.validUntil) return 'expired';
  if (c.usageQuota !== null && c.usedCount >= c.usageQuota) return 'redeemed';
  return 'active';
}
