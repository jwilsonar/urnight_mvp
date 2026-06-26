import type { Role, RoleCode } from '../../../../modules/identity/domain/entities/role.entity';
import type { RoleRepository } from '../../../../modules/identity/domain/ports/role.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** RoleRepository en memoria. Datos de referencia: usar `seed()` para precargar. */
export class InMemoryRoleRepository
  extends InMemoryRepository<Role>
  implements RoleRepository
{
  /** Precarga un rol del catálogo (no hay create en el puerto: son datos seed). */
  seed(role: Role): this {
    this.put(role);
    return this;
  }

  async findById(id: string): Promise<Role | null> {
    return this.getById(id);
  }

  async findByCode(code: RoleCode): Promise<Role | null> {
    return this.values().find((r) => r.code === code) ?? null;
  }

  async listAll(): Promise<Role[]> {
    return this.values();
  }
}
