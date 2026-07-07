import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GoogleLoginDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { User } from '../../domain/entities/user.entity';
import {
  AccountDisabledError,
  GoogleEmailNotVerifiedError,
} from '../../domain/errors/identity.errors';
import { GoogleVerifier, type GoogleProfile } from '../../domain/ports/google-verifier.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';
import { UserProvisioningService } from '../services/user-provisioning.service';

/**
 * Caso de uso: login federado con Google (OIDC). Verifica el ID token (ACL),
 * exige `email_verified` (M4) antes de enlazar/crear, resuelve la cuenta
 * (por google_sub → por email → alta nueva) y emite tokens.
 */
@Injectable()
export class GoogleLoginUseCase {
  private readonly log = createLogger(GoogleLoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly google: GoogleVerifier,
    private readonly issuer: TokenIssuer,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async execute(dto: GoogleLoginDto): Promise<AuthResult> {
    this.log.debug({}, 'identity.login.started');
    const profile = await this.google.verify(dto.idToken);

    // M4: nunca enlazar/crear con un email no verificado por el IdP (pre-hijacking).
    if (!profile.emailVerified) {
      this.log.warn({}, 'identity.login.google_email_unverified');
      throw new GoogleEmailNotVerifiedError();
    }

    let user = await this.users.findByGoogleSub(profile.sub);
    if (!user) {
      const existing = await this.users.findByEmail(profile.email);
      user = existing ? await this.linkExisting(existing, profile.sub) : await this.createNew(profile);
    }
    if (!user.isActive) {
      this.log.warn({ userId: user.id }, 'identity.login.account_disabled');
      throw new AccountDisabledError();
    }

    user.recordLogin();
    await this.users.update(user);

    this.log.info({ userId: user.id, provider: 'google' }, 'identity.login.success');
    return this.issuer.issueFor(user);
  }

  private async linkExisting(user: User, googleSub: string): Promise<User> {
    user.linkGoogle(googleSub);
    return this.users.update(user);
  }

  private async createNew(profile: GoogleProfile): Promise<User> {
    const user = User.registerWithGoogle({
      id: randomUUID(),
      fullName: profile.name,
      email: profile.email,
      googleSub: profile.sub,
      avatarUrl: profile.picture,
    });

    await this.provisioning.provision({
      user,
      emailJob: {
        queue: 'notifications',
        name: 'send-welcome-email',
        data: { userId: user.id, email: user.email },
      },
    });

    return user;
  }
}
