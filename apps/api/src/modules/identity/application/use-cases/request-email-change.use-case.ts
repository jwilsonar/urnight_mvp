import { Inject, Injectable } from '@nestjs/common';
import { webUrlFor } from '../../../../shared/config/web-url';
import { createLogger } from '../../../../shared/logging/logger';
import { OutboxPort } from '../../../../shared/outbox/outbox.port';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class RequestEmailChangeUseCase {
  private readonly log = createLogger(RequestEmailChangeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(input: {
    userId: string;
    newEmail: string;
    currentPassword: string;
  }): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    if (
      !user.passwordHash ||
      !(await this.hasher.verify(user.passwordHash, input.currentPassword))
    ) {
      throw new InvalidCredentialsError();
    }

    const newEmail = input.newEmail.trim().toLowerCase();
    const existing = await this.users.findByEmail(newEmail);
    if (existing && existing.id !== user.id) throw new EmailAlreadyRegisteredError();
    const token = await this.tokens.signEmailChange({ sub: user.id, newEmail });
    // El enlace se arma aquí (la API conoce la base pública); el worker solo envía.
    const verificationUrl = webUrlFor(
      `/verify-email?token=${encodeURIComponent(token)}&type=email-change`,
    );
    await this.outbox.enqueue({
      queue: 'notifications',
      name: 'send-email-change-verification',
      data: { userId: user.id, newEmail, verificationUrl },
    });
    this.log.info({ userId: user.id }, 'identity.email.change_requested');
  }
}
