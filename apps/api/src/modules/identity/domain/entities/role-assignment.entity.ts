export interface RoleAssignmentProps {
  id: string;
  userId: string;
  roleId: string;
  companyId: string | null;
  localId: string | null;
  isActive: boolean;
  grantedAt: Date;
  grantedBy: string | null;
}

/**
 * Asignación de rol (USER_ROLE) — liga un rol a un usuario dentro de un scope
 * multi-tenant (company_id/local_id). El scope se evalúa en cada query (§5).
 */
export class RoleAssignment {
  private constructor(private readonly props: RoleAssignmentProps) {}

  static grant(input: {
    id: string;
    userId: string;
    roleId: string;
    companyId?: string | null;
    localId?: string | null;
    grantedBy?: string | null;
  }): RoleAssignment {
    return new RoleAssignment({
      id: input.id,
      userId: input.userId,
      roleId: input.roleId,
      companyId: input.companyId ?? null,
      localId: input.localId ?? null,
      isActive: true,
      grantedAt: new Date(),
      grantedBy: input.grantedBy ?? null,
    });
  }

  static fromPersistence(props: RoleAssignmentProps): RoleAssignment {
    return new RoleAssignment(props);
  }

  revoke(): void {
    this.props.isActive = false;
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get roleId(): string {
    return this.props.roleId;
  }
  get companyId(): string | null {
    return this.props.companyId;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get grantedAt(): Date {
    return this.props.grantedAt;
  }
  get grantedBy(): string | null {
    return this.props.grantedBy;
  }
}
