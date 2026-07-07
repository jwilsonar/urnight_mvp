import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegisterDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { User } from '../../domain/entities/user.entity';
import {
  DocumentAlreadyRegisteredError,
  EmailAlreadyRegisteredError,
} from '../../domain/errors/identity.errors';
import { PersonalId } from '../../domain/value-objects/personal-id.value-object';
import { TokenService } from '../../domain/ports/token.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';
import { UserProvisioningService } from '../services/user-provisioning.service';

/**
 * Caso de uso: registro con email + contraseña. Atómico (UoW, vía
 * UserProvisioningService): crea usuario + preferencias + rol por defecto y encola
 * el email de verificación en una sola Tx. Invariantes: email/documento únicos,
 * 18+ (vía PersonalId). Emite UserRegistered.
 */
@Injectable()
export class RegisterUseCase {
  private readonly log = createLogger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly issuer: TokenIssuer,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResult> {
    this.log.debug({ documentType: dto.documentType }, 'identity.register.started');
    if (await this.users.existsByEmail(dto.email)) {
      this.log.warn({}, 'identity.register.email_taken');
      throw new EmailAlreadyRegisteredError();
    }
    if (await this.users.findByDocumentNumber(dto.documentNumber)) {
      throw new DocumentAlreadyRegisteredError();
    }

    const identity = PersonalId.create({
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      birthDate: new Date(dto.birthDate),
    });
    const passwordHash = await this.hasher.hash(dto.password);

    const user = User.registerWithEmail({
      id: randomUUID(),
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      identity,
      phone: dto.phone ?? null,
    });

    // Token de verificación firmado antes de la Tx; el enqueue va DENTRO de ella (M8).
    const verificationToken = await this.tokens.signEmailVerification(user.id);
    await this.provisioning.provision({
      user,
      acceptsMarketing: dto.acceptsMarketing,
      emailJob: {
        queue: 'notifications',
        name: 'send-verification-email',
        data: { userId: user.id, email: user.email, token: verificationToken },
      },
    });

    this.log.info({ userId: user.id }, 'identity.register.created');
    return this.issuer.issueFor(user);
  }
}
