import type { Role } from '../../../modules/identity/domain/entities/role.entity';
import { RoleBuilder } from '../builders/role.builder';

/** Catálogo RBAC predefinido. */
export const RoleMother = {
  user: (): Role => new RoleBuilder().withCode('user').withName('Usuario').build(),
  adminLocal: (): Role =>
    new RoleBuilder().withCode('admin_local').withName('Admin Local').build(),
  promoter: (): Role => new RoleBuilder().withCode('promoter').withName('Promotor').build(),
  validator: (): Role => new RoleBuilder().withCode('validator').withName('Validador').build(),
  superAdmin: (): Role =>
    new RoleBuilder().withCode('super_admin').withName('Super Admin').build(),
};
