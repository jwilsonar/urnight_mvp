import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { user } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { User } from '../../domain/entities/user.entity';
import type { AuthProvider } from '../../domain/entities/user.entity';
import { PersonalId, type DocumentType } from '../../domain/value-objects/personal-id.value-object';
import type { UserRepository } from '../../domain/ports/user.repository';

type UserRow = typeof user.$inferSelect;

/** Adapter Drizzle del puerto UserRepository (driven). */
@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /** Ejecutor de la query: la Tx del Unit of Work si la hay, si no el pool. */
  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(user).where(eq(user.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByGoogleSub(googleSub: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(user)
      .where(eq(user.googleSub, googleSub))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByDocumentNumber(documentNumber: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(user)
      .where(eq(user.documentNumber, documentNumber.trim()))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);
    return Boolean(row);
  }

  async create(entity: User, tx?: unknown): Promise<User> {
    const [row] = await this.exec(tx).insert(user).values(this.toRow(entity)).returning();
    if (!row) throw new Error('No se pudo crear el usuario');
    return this.toDomain(row);
  }

  async update(entity: User): Promise<User> {
    const id = entity.identity;
    const [row] = await this.db
      .update(user)
      .set({
        emailVerified: entity.emailVerified,
        isActive: entity.isActive,
        googleSub: entity.googleSub,
        lastLoginAt: entity.lastLoginAt,
        documentType: id?.documentType ?? null,
        documentNumber: id?.documentNumber ?? null,
        birthDate: id ? this.toDateString(id.birthDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el usuario');
    return this.toDomain(row);
  }

  private toRow(u: User): typeof user.$inferInsert {
    const id = u.identity;
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      passwordHash: u.passwordHash,
      authProvider: u.authProvider,
      googleSub: u.googleSub,
      documentType: id?.documentType ?? null,
      documentNumber: id?.documentNumber ?? null,
      birthDate: id ? this.toDateString(id.birthDate) : null,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      emailVerified: u.emailVerified,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  /** Columna `date` (sin hora) → 'YYYY-MM-DD'. */
  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private toDomain(row: UserRow): User {
    const identity =
      row.documentType && row.documentNumber && row.birthDate
        ? PersonalId.create({
            documentType: row.documentType as DocumentType,
            documentNumber: row.documentNumber,
            birthDate: new Date(row.birthDate),
          })
        : null;
    return User.fromPersistence({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      passwordHash: row.passwordHash,
      authProvider: row.authProvider as AuthProvider,
      googleSub: row.googleSub,
      identity,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      emailVerified: row.emailVerified,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
