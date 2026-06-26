import { Inject, Injectable } from '@nestjs/common';
import type { VerifyEmailDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import type { User } from '../../domain/entities/user.entity';
import { InvalidTokenError } from '../../domain/errors/identity.errors';
import { EmailVerifiedEvent } from '../../domain/events/identity.events';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

/** Caso de uso: verificar el email mediante el token firmado enviado por correo. */
@Injectable()
export class VerifyEmailUseCase {
  private readonly log = createLogger(VerifyEmailUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly events: EventBus,
  ) {}

  async execute(dto: VerifyEmailDto): Promise<User> {
    const { sub } = await this.tokens.verifyEmailVerification(dto.token);
    const user = await this.users.findById(sub);
    if (!user) {
      this.log.warn({}, 'identity.token.refresh_invalid');
      throw new InvalidTokenError();
    }

    if (!user.emailVerified) {
      user.markEmailVerified();
      await this.users.update(user);
      await this.events.publish(new EmailVerifiedEvent({ userId: user.id }));
      this.log.info({ userId: user.id }, 'identity.email.verified');
    }
    return user;
  }
}
