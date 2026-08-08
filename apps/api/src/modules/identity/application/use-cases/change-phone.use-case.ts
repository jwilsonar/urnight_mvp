import { Inject, Injectable } from '@nestjs/common';
import { peruMobileSchema } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  InvalidCredentialsError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class ChangePhoneUseCase {
  private readonly log = createLogger(ChangePhoneUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: {
    userId: string;
    phone: string;
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

    user.changePhone(peruMobileSchema.parse(input.phone));
    await this.users.update(user);
    this.log.info({ userId: user.id }, 'identity.phone.changed');
  }
}
