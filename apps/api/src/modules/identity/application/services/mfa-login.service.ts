import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { User } from '../../domain/entities/user.entity';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { TokenIssuer, type AuthResult } from './token-issuer.service';

const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;

export type LoginOutcome =
  | { kind: 'session'; result: AuthResult }
  | { kind: 'mfa_challenge'; challengeId: string; expiresAt: string };

/** Fuente única de la bifurcación password/Google → sesión o desafío MFA. */
@Injectable()
export class MfaLoginService {
  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    private readonly issuer: TokenIssuer,
  ) {}

  async complete(user: User): Promise<LoginOutcome> {
    if (!(await this.mfa.hasActiveFactor(user.id))) {
      return { kind: 'session', result: await this.issuer.issueFor(user) };
    }

    const now = Date.now();
    const challenge = {
      id: randomUUID(),
      userId: user.id,
      expiresAt: new Date(now + MFA_CHALLENGE_TTL_SECONDS * 1000),
    };
    await this.mfa.storeChallenge(challenge);
    return {
      kind: 'mfa_challenge',
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }
}
