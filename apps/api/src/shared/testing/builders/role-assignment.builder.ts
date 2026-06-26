import { randomUUID } from 'node:crypto';
import { RoleAssignment } from '../../../modules/identity/domain/entities/role-assignment.entity';

/** Builder fluido para RoleAssignment (USER_ROLE) con scope multi-tenant. */
export class RoleAssignmentBuilder {
  private id: string = randomUUID();
  private userId: string = randomUUID();
  private roleId: string = randomUUID();
  private companyId: string | null = null;
  private localId: string | null = null;
  private grantedBy: string | null = null;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withRoleId(roleId: string): this {
    this.roleId = roleId;
    return this;
  }

  withScope(companyId: string | null, localId: string | null): this {
    this.companyId = companyId;
    this.localId = localId;
    return this;
  }

  grantedByUser(grantedBy: string | null): this {
    this.grantedBy = grantedBy;
    return this;
  }

  build(): RoleAssignment {
    return RoleAssignment.grant({
      id: this.id,
      userId: this.userId,
      roleId: this.roleId,
      companyId: this.companyId,
      localId: this.localId,
      grantedBy: this.grantedBy,
    });
  }
}
