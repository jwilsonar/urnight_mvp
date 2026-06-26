import type { User } from '../../../../modules/identity/domain/entities/user.entity';
import type { UserRepository } from '../../../../modules/identity/domain/ports/user.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** UserRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryUserRepository
  extends InMemoryRepository<User>
  implements UserRepository
{
  async findById(id: string): Promise<User | null> {
    return this.getById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const target = email.trim().toLowerCase();
    return this.values().find((u) => u.email === target) ?? null;
  }

  async findByGoogleSub(googleSub: string): Promise<User | null> {
    return this.values().find((u) => u.googleSub === googleSub) ?? null;
  }

  async findByDocumentNumber(documentNumber: string): Promise<User | null> {
    return this.values().find((u) => u.identity?.documentNumber === documentNumber) ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const target = email.trim().toLowerCase();
    return this.values().some((u) => u.email === target);
  }

  async create(user: User, _tx?: unknown): Promise<User> {
    this.put(user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.put(user);
    return user;
  }
}
