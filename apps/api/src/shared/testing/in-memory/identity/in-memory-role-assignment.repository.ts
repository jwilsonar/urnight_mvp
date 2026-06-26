import type { RoleAssignment } from '../../../../modules/identity/domain/entities/role-assignment.entity';
import type {
  AssignmentScope,
  RoleAssignmentRepository,
} from '../../../../modules/identity/domain/ports/role-assignment.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** RoleAssignmentRepository en memoria. `exists` compara el scope multi-tenant. */
export class InMemoryRoleAssignmentRepository
  extends InMemoryRepository<RoleAssignment>
  implements RoleAssignmentRepository
{
  async findActiveByUser(userId: string): Promise<RoleAssignment[]> {
    return this.values().filter((a) => a.userId === userId && a.isActive);
  }

  async findById(id: string): Promise<RoleAssignment | null> {
    return this.getById(id);
  }

  async exists(userId: string, roleId: string, scope: AssignmentScope): Promise<boolean> {
    return this.values().some(
      (a) =>
        a.userId === userId &&
        a.roleId === roleId &&
        a.companyId === scope.companyId &&
        a.localId === scope.localId &&
        a.isActive,
    );
  }

  async create(assignment: RoleAssignment, _tx?: unknown): Promise<RoleAssignment> {
    this.put(assignment);
    return assignment;
  }

  async update(assignment: RoleAssignment): Promise<RoleAssignment> {
    this.put(assignment);
    return assignment;
  }
}
