import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { role } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { Role, type RoleCode } from '../../domain/entities/role.entity';
import type { RoleRepository } from '../../domain/ports/role.repository';

type RoleRow = typeof role.$inferSelect;

/** Adapter Drizzle del puerto RoleRepository (lectura del catálogo de roles). */
@Injectable()
export class DrizzleRoleRepository implements RoleRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<Role | null> {
    const [row] = await this.db.select().from(role).where(eq(role.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: RoleCode): Promise<Role | null> {
    const [row] = await this.db.select().from(role).where(eq(role.code, code)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async listAll(): Promise<Role[]> {
    const rows = await this.db.select().from(role);
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: RoleRow): Role {
    return Role.fromPersistence({
      id: row.id,
      code: row.code as RoleCode,
      name: row.name,
      description: row.description,
      permissions: (row.permissions as Record<string, unknown>) ?? {},
    });
  }
}
