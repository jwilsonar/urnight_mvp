import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { userRole } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type {
  AssignmentScope,
  RoleAssignmentRepository,
} from '../../domain/ports/role-assignment.repository';

type UserRoleRow = typeof userRole.$inferSelect;

/** Adapter Drizzle del puerto RoleAssignmentRepository (USER_ROLE). */
@Injectable()
export class DrizzleRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findActiveByUser(userId: string): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(userRole)
      .where(and(eq(userRole.userId, userId), eq(userRole.isActive, true)));
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<RoleAssignment | null> {
    const [row] = await this.db.select().from(userRole).where(eq(userRole.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async exists(userId: string, roleId: string, scope: AssignmentScope): Promise<boolean> {
    const [row] = await this.db
      .select({ id: userRole.id })
      .from(userRole)
      .where(
        and(
          eq(userRole.userId, userId),
          eq(userRole.roleId, roleId),
          eq(userRole.isActive, true),
          scope.companyId === null
            ? isNull(userRole.companyId)
            : eq(userRole.companyId, scope.companyId),
          scope.localId === null
            ? isNull(userRole.localId)
            : eq(userRole.localId, scope.localId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async create(entity: RoleAssignment, tx?: unknown): Promise<RoleAssignment> {
    const [row] = await this.exec(tx)
      .insert(userRole)
      .values({
        id: entity.id,
        userId: entity.userId,
        roleId: entity.roleId,
        companyId: entity.companyId,
        localId: entity.localId,
        isActive: entity.isActive,
        grantedAt: entity.grantedAt,
        grantedBy: entity.grantedBy,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la asignación de rol');
    return this.toDomain(row);
  }

  async update(entity: RoleAssignment): Promise<RoleAssignment> {
    const [row] = await this.db
      .update(userRole)
      .set({ isActive: entity.isActive })
      .where(eq(userRole.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la asignación de rol');
    return this.toDomain(row);
  }

  private toDomain(row: UserRoleRow): RoleAssignment {
    return RoleAssignment.fromPersistence({
      id: row.id,
      userId: row.userId,
      roleId: row.roleId,
      companyId: row.companyId,
      localId: row.localId,
      isActive: row.isActive,
      grantedAt: row.grantedAt,
      grantedBy: row.grantedBy,
    });
  }
}
