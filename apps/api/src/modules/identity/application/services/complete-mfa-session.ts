import {
  AccountDisabledError,
  MfaChallengeExpiredError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import type {
  MfaChallenge,
  MfaRepository,
} from '../../domain/ports/mfa.repository';
import type { UserRepository } from '../../domain/ports/user.repository';
import type { AuthResult, TokenIssuer } from './token-issuer.service';

/** Camino unico challenge consumido -> usuario activo -> sesion. */
export async function completeMfaSession(
  challenge: MfaChallenge,
  dependencies: {
    mfa: MfaRepository;
    users: UserRepository;
    issuer: TokenIssuer;
    factorId?: string;
  },
): Promise<AuthResult> {
  if (!(await dependencies.mfa.consumeChallenge(challenge.id, challenge.userId))) {
    throw new MfaChallengeExpiredError();
  }
  const user = await dependencies.users.findById(challenge.userId);
  if (!user) throw new UserNotFoundError();
  if (!user.isActive) throw new AccountDisabledError();
  if (dependencies.factorId) {
    await dependencies.mfa.markFactorUsed(dependencies.factorId, new Date());
  }
  return dependencies.issuer.issueFor(user);
}
