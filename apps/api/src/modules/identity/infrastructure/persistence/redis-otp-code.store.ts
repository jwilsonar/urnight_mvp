import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../../../../shared/redis/redis.module';
import type {
  OtpCodeConsumeResult,
  OtpCodeStore,
} from '../../domain/ports/otp-code.store';

const OTP_NS = 'identity:otp:email';
const RESEND_COOLDOWN_SECONDS = 60;
const codeKey = (id: string): string => `${OTP_NS}:${id}`;
const attemptsKey = (id: string): string => `${OTP_NS}:attempts:${id}`;
const cooldownKey = (id: string): string => `${OTP_NS}:cooldown:${id}`;

const ISSUE_SCRIPT = `
if redis.call('EXISTS', KEYS[3]) == 1 then return 0 end
redis.call('SET', KEYS[3], ARGV[2], 'EX', ARGV[3])
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])
redis.call('DEL', KEYS[2])
return 1
`;

const CONSUME_SCRIPT = `
local stored = redis.call('GET', KEYS[1])
if not stored then return 'expired' end
if stored == ARGV[1] then
  redis.call('DEL', KEYS[1], KEYS[2])
  return 'consumed'
end
local count = redis.call('INCR', KEYS[2])
local ttl = redis.call('TTL', KEYS[1])
if ttl > 0 then redis.call('EXPIRE', KEYS[2], ttl) end
if count >= 6 then redis.call('DEL', KEYS[1]) end
return 'invalid'
`;

/** Redis mantiene TTL, cooldown y limite de intentos de forma atomica. */
@Injectable()
export class RedisOtpCodeStore implements OtpCodeStore {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async issue(key: string, codeHash: string, ttlSeconds: number): Promise<boolean> {
    const issuedAt = Date.now();
    const result = await this.redis.eval(
      ISSUE_SCRIPT,
      3,
      codeKey(key),
      attemptsKey(key),
      cooldownKey(key),
      codeHash,
      String(issuedAt),
      String(RESEND_COOLDOWN_SECONDS),
      String(ttlSeconds),
    );
    return Number(result) === 1;
  }

  async consume(key: string, codeHash: string): Promise<OtpCodeConsumeResult> {
    return (await this.redis.eval(
      CONSUME_SCRIPT,
      2,
      codeKey(key),
      attemptsKey(key),
      codeHash,
    )) as OtpCodeConsumeResult;
  }

  async attempts(key: string): Promise<number> {
    return Number((await this.redis.get(attemptsKey(key))) ?? 0);
  }

  async lastIssuedAt(key: string): Promise<Date | null> {
    const value = await this.redis.get(cooldownKey(key));
    return value ? new Date(Number(value)) : null;
  }
}
