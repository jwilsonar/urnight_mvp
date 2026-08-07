import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { createLogger } from '../../../../shared/logging/logger';
import {
  EmailAlreadyRegisteredError,
  InvalidTokenError,
} from '../../domain/errors/identity.errors';
import { EmailChangedEvent } from '../../domain/events/identity.events';
import { RefreshTokenStore } from '../../domain/ports/refresh-token-store.port';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class ConfirmEmailChangeUseCase {
  private readonly log = createLogger(ConfirmEmailChangeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly events: EventBus,
    private readonly refreshTokens: RefreshTokenStore,
  ) {}

  async execute(input: { token: string }): Promise<void> {
    const { sub, newEmail } = await this.tokens.verifyEmailChange(input.token);
    const user = await this.users.findById(sub);
    if (!user) throw new InvalidTokenError();
    const existing = await this.users.findByEmail(newEmail);
    if (existing && existing.id !== user.id) throw new EmailAlreadyRegisteredError();
    if (user.email === newEmail && user.emailVerified) return;

    user.changeEmail(newEmail);
    await this.users.update(user);
    await this.events.publish(new EmailChangedEvent({ userId: user.id }));
    await this.refreshTokens.revokeAllForUser(user.id);
    this.log.info({ userId: user.id }, 'identity.email.changed');
  }
}
