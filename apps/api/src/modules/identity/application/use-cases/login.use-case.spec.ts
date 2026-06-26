import { describe, expect, it } from 'vitest';
import { Role } from '../../domain/entities/role.entity';
import type { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import { User } from '../../domain/entities/user.entity';
import { PersonalId } from '../../domain/value-objects/personal-id.value-object';
import { InvalidCredentialsError } from '../../domain/errors/identity.errors';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { RoleAssignmentRepository } from '../../domain/ports/role-assignment.repository';
import type { RoleRepository } from '../../domain/ports/role.repository';
import type { TokenService } from '../../domain/ports/token.port';
import type { UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer } from '../services/token-issuer.service';
import { LoginUseCase } from './login.use-case';

const identity = PersonalId.create({
  documentType: 'dni',
  documentNumber: '12345678',
  birthDate: new Date('2000-01-01'),
});

const existing = User.registerWithEmail({
  id: 'u1',
  fullName: 'Ada',
  email: 'ada@example.com',
  passwordHash: 'hashed:supersecret',
  identity,
});

const users: UserRepository = {
  findById: async () => null,
  findByEmail: async (email) => (email.toLowerCase() === existing.email ? existing : null),
  findByGoogleSub: async () => null,
  findByDocumentNumber: async () => null,
  existsByEmail: async () => true,
  create: async (u) => u,
  update: async (u) => u,
};

const hasher: PasswordHasher = {
  hash: async (p) => `hashed:${p}`,
  verify: async (hash, plain) => hash === `hashed:${plain}`,
};

const tokens: TokenService = {
  signAccess: async () => ({ token: 'access', expiresIn: 900 }),
  signRefresh: async () => ({ token: 'refresh', expiresIn: 604800 }),
  verifyRefresh: async () => ({ sub: 'x' }),
  signEmailVerification: async () => 't',
  verifyEmailVerification: async () => ({ sub: 'x' }),
};

const assignments: RoleAssignmentRepository = {
  findActiveByUser: async (): Promise<RoleAssignment[]> => [],
  findById: async () => null,
  exists: async () => false,
  create: async (a) => a,
  update: async (a) => a,
};

const roles: RoleRepository = {
  findById: async () => null,
  findByCode: async () => null,
  listAll: async () => [
    Role.fromPersistence({ id: 'r', code: 'user', name: 'U', description: null, permissions: {} }),
  ],
};

const useCase = new LoginUseCase(users, hasher, new TokenIssuer(assignments, roles, tokens));

describe('LoginUseCase', () => {
  it('autentica con credenciales válidas y emite tokens', async () => {
    const result = await useCase.execute({ email: 'ada@example.com', password: 'supersecret' });
    expect(result.access.token).toBe('access');
  });

  it('rechaza contraseña incorrecta', async () => {
    await expect(
      useCase.execute({ email: 'ada@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rechaza email inexistente con el mismo error genérico', async () => {
    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
