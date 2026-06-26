import type { User } from '../entities/user.entity';

/**
 * Puerto del repositorio de usuarios (Port). El dominio habla con esta interfaz;
 * el adapter Drizzle vive en infrastructure (§3.2 Repository).
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleSub(googleSub: string): Promise<User | null>;
  findByDocumentNumber(documentNumber: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  /** `tx` opcional: ejecutor de Unit of Work (seam neutral; el dominio no conoce Drizzle). */
  create(user: User, tx?: unknown): Promise<User>;
  /** Persiste mutaciones del aggregate (emailVerified, lastLogin, identity, isActive). */
  update(user: User): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
