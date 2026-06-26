import { randomUUID } from 'node:crypto';
import {
  Role,
  type RoleCode,
} from '../../../modules/identity/domain/entities/role.entity';

/** Builder fluido para Role (catálogo RBAC). */
export class RoleBuilder {
  private id: string = randomUUID();
  private code: RoleCode = 'user';
  private name = 'Usuario';
  private description: string | null = null;
  private permissions: Record<string, unknown> = {};

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCode(code: RoleCode): this {
    this.code = code;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withDescription(description: string | null): this {
    this.description = description;
    return this;
  }

  withPermissions(permissions: Record<string, unknown>): this {
    this.permissions = permissions;
    return this;
  }

  build(): Role {
    return Role.fromPersistence({
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
    });
  }
}
