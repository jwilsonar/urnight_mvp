// Fuente única del tipo: el catálogo canónico vive en @urnight/contracts
// (roleCodeSchema/ROLE_CODES). El dominio reexporta ese tipo para evitar drift
// (antes había una unión literal duplicada aquí). §5 RBAC.
import type { RoleCode } from '@urnight/contracts';

export type { RoleCode };

export interface RoleProps {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  permissions: Record<string, unknown>;
}

/** Catálogo de roles RBAC (§5). Datos de referencia; sin mutaciones en el MVP. */
export class Role {
  private constructor(private readonly props: RoleProps) {}

  static fromPersistence(props: RoleProps): Role {
    return new Role(props);
  }

  get id(): string {
    return this.props.id;
  }
  get code(): RoleCode {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get permissions(): Record<string, unknown> {
    return this.props.permissions;
  }
}
