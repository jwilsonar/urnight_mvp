import { describe, expect, it } from 'vitest';
import { Role } from './role.entity';
import { RoleBuilder, RoleMother } from '../../../../shared/testing';

describe('Role (catálogo RBAC)', () => {
  it('hidrata desde persistencia con todos sus campos', () => {
    const role = Role.fromPersistence({
      id: 'r1',
      code: 'admin_local',
      name: 'Admin Local',
      description: 'Gestiona su local',
      permissions: { events: ['create'] },
    });
    expect(role.id).toBe('r1');
    expect(role.code).toBe('admin_local');
    expect(role.name).toBe('Admin Local');
    expect(role.description).toBe('Gestiona su local');
    expect(role.permissions).toEqual({ events: ['create'] });
  });

  it('builder produce el rol por defecto (user) sin descripción', () => {
    const role = new RoleBuilder().build();
    expect(role.code).toBe('user');
    expect(role.description).toBeNull();
    expect(role.permissions).toEqual({});
  });

  it('mother expone los códigos RBAC del MVP', () => {
    expect(RoleMother.user().code).toBe('user');
    expect(RoleMother.adminLocal().code).toBe('admin_local');
    expect(RoleMother.promoter().code).toBe('promoter');
    expect(RoleMother.validator().code).toBe('validator');
    expect(RoleMother.superAdmin().code).toBe('super_admin');
  });
});
