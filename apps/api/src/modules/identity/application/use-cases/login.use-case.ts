import { Inject, Injectable } from '@nestjs/common';
import type { LoginDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { AccountDisabledError, InvalidCredentialsError } from '../../domain/errors/identity.errors';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { MfaLoginService, type LoginOutcome } from '../services/mfa-login.service';

/** Caso de uso: login email + contraseña. Mensaje genérico para no filtrar existencia. */
@Injectable()
export class LoginUseCase {
  private readonly log = createLogger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly mfaLogin: MfaLoginService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginOutcome> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      // Credenciales: mismo path para "no existe" y "clave mala" (no filtrar).
      this.log.warn({}, 'identity.login.invalid_credentials');
      throw new InvalidCredentialsError();
    }

    const ok = await this.hasher.verify(user.passwordHash, dto.password);
    if (!ok) {
      this.log.warn({ userId: user.id }, 'identity.login.invalid_credentials');
      throw new InvalidCredentialsError();
    }
    if (!user.isActive) {
      this.log.warn({ userId: user.id }, 'identity.login.account_disabled');
      throw new AccountDisabledError();
    }

    user.recordLogin();
    await this.users.update(user);

    this.log.info({ userId: user.id, provider: 'password' }, 'identity.login.success');
    return this.mfaLogin.complete(user);
  }
}
