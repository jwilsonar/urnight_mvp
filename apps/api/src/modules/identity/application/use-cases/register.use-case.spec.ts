import { describe, expect, it } from 'vitest';
import type { RegisterDto } from '@urnight/contracts';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { OutboxPort, type OutboxJob } from '../../../../shared/outbox/outbox.port';
import type { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { Role } from '../../domain/entities/role.entity';
import type { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type { User } from '../../domain/entities/user.entity';
import type { UserPreference } from '../../domain/entities/user-preference.entity';
import {
  DocumentAlreadyRegisteredError,
  EmailAlreadyRegisteredError,
  UnderageError,
} from '../../domain/errors/identity.errors';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type {
  AssignmentScope,
  RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';
import type { RoleRepository } from '../../domain/ports/role.repository';
import type { UserPreferenceRepository } from '../../domain/ports/user-preference.repository';
import type { UserRepository } from '../../domain/ports/user.repository';
import type { AccessTokenClaims, IssuedToken, TokenService } from '../../domain/ports/token.port';
import { TokenIssuer } from '../services/token-issuer.service';
import { RegisterUseCase } from './register.use-case';

class InMemoryUsers implements UserRepository {
  users: User[] = [];
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email.toLowerCase()) ?? null;
  }
  async findByGoogleSub(sub: string) {
    return this.users.find((u) => u.googleSub === sub) ?? null;
  }
  async findByDocumentNumber(doc: string) {
    return this.users.find((u) => u.identity?.documentNumber === doc) ?? null;
  }
  async existsByEmail(email: string) {
    return this.users.some((u) => u.email === email.toLowerCase());
  }
  async create(user: User) {
    this.users.push(user);
    return user;
  }
  async update(user: User) {
    return user;
  }
}

class InMemoryPreferences implements UserPreferenceRepository {
  items: UserPreference[] = [];
  async findByUser(userId: string) {
    return this.items.find((p) => p.userId === userId) ?? null;
  }
  async create(p: UserPreference) {
    this.items.push(p);
    return p;
  }
  async update(p: UserPreference) {
    return p;
  }
}

class InMemoryAssignments implements RoleAssignmentRepository {
  items: RoleAssignment[] = [];
  async findActiveByUser(userId: string) {
    return this.items.filter((a) => a.userId === userId && a.isActive);
  }
  async findById(id: string) {
    return this.items.find((a) => a.id === id) ?? null;
  }
  async exists(userId: string, roleId: string, _scope: AssignmentScope) {
    return this.items.some((a) => a.userId === userId && a.roleId === roleId && a.isActive);
  }
  async create(a: RoleAssignment) {
    this.items.push(a);
    return a;
  }
  async update(a: RoleAssignment) {
    return a;
  }
}

const userRole = Role.fromPersistence({
  id: 'role-user',
  code: 'user',
  name: 'Usuario',
  description: null,
  permissions: {},
});

const roles: RoleRepository = {
  findById: async (id) => (id === userRole.id ? userRole : null),
  findByCode: async (code) => (code === 'user' ? userRole : null),
  listAll: async () => [userRole],
};

const hasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (hash, plain) => hash === `hashed:${plain}`,
};

const tokens: TokenService = {
  signAccess: async (_c: AccessTokenClaims): Promise<IssuedToken> => ({ token: 'access', expiresIn: 900 }),
  signRefresh: async (): Promise<IssuedToken> => ({ token: 'refresh', expiresIn: 604800 }),
  verifyRefresh: async () => ({ sub: 'x' }),
  signEmailVerification: async () => 'verify-token',
  verifyEmailVerification: async () => ({ sub: 'x' }),
};

class FakeOutbox extends OutboxPort {
  jobs: OutboxJob[] = [];
  async enqueue<T>(job: OutboxJob<T>) {
    this.jobs.push(job);
  }
}

// UoW de prueba: ejecuta el trabajo sin transacción real.
const uow = { run: async <T>(work: (tx: unknown) => Promise<T>) => work(undefined) } as unknown as UnitOfWork;

const dto: RegisterDto = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'supersecret',
  birthDate: '2000-01-01',
  documentType: 'dni',
  documentNumber: '12345678',
  acceptsMarketing: false,
};

function build() {
  const users = new InMemoryUsers();
  const preferences = new InMemoryPreferences();
  const assignments = new InMemoryAssignments();
  const outbox = new FakeOutbox();
  const events = new EventBus();
  const issuer = new TokenIssuer(assignments, roles, tokens);
  const useCase = new RegisterUseCase(
    users,
    preferences,
    roles,
    assignments,
    hasher,
    tokens,
    issuer,
    uow,
    events,
    outbox,
  );
  return { useCase, users, preferences, assignments, outbox, events };
}

describe('RegisterUseCase', () => {
  it('crea usuario + preferencias + rol por defecto, emite evento y emite tokens', async () => {
    const { useCase, users, preferences, assignments, outbox, events } = build();
    const received: string[] = [];
    events.subscribe('identity.user_registered', (e) => {
      received.push(e.name);
    });

    const result = await useCase.execute(dto);

    expect(result.access.token).toBe('access');
    expect(result.refresh.token).toBe('refresh');
    expect(users.users).toHaveLength(1);
    expect(preferences.items).toHaveLength(1);
    expect(assignments.items).toHaveLength(1);
    expect(assignments.items[0]?.roleId).toBe('role-user');
    expect(received).toContain('identity.user_registered');
    expect(outbox.jobs[0]?.name).toBe('send-verification-email');
  });

  it('rechaza email ya registrado', async () => {
    const { useCase } = build();
    await useCase.execute(dto);
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('rechaza registro de un menor con UnderageError tipado (invariante 18+, no 500)', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ ...dto, birthDate: '2015-01-01' }),
    ).rejects.toBeInstanceOf(UnderageError);
  });

  it('rechaza documento ya registrado (invariante: document_number único)', async () => {
    const { useCase } = build();
    await useCase.execute(dto);
    await expect(
      useCase.execute({ ...dto, email: 'otra@example.com' }),
    ).rejects.toBeInstanceOf(DocumentAlreadyRegisteredError);
  });
});
