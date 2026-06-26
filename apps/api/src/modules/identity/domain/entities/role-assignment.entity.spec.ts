import { describe, expect, it } from 'vitest';
import { RoleAssignment } from './role-assignment.entity';
import { RoleAssignmentBuilder } from '../../../../shared/testing';

describe('RoleAssignment (USER_ROLE)', () => {
  describe('grant', () => {
    it('acepta valor válido: asignación activa, scope global por defecto', () => {
      const a = RoleAssignment.grant({ id: 'a1', userId: 'u1', roleId: 'r1' });
      expect(a.id).toBe('a1');
      expect(a.userId).toBe('u1');
      expect(a.roleId).toBe('r1');
      expect(a.isActive).toBe(true);
      expect(a.companyId).toBeNull();
      expect(a.localId).toBeNull();
      expect(a.grantedBy).toBeNull();
      expect(a.grantedAt).toBeInstanceOf(Date);
    });

    it('acepta scope multi-tenant (company/local) y grantedBy', () => {
      const a = RoleAssignment.grant({
        id: 'a2',
        userId: 'u1',
        roleId: 'r1',
        companyId: 'c1',
        localId: 'l1',
        grantedBy: 'admin-1',
      });
      expect(a.companyId).toBe('c1');
      expect(a.localId).toBe('l1');
      expect(a.grantedBy).toBe('admin-1');
    });
  });

  describe('revoke', () => {
    it('soft-delete: desactiva la asignación', () => {
      const a = new RoleAssignmentBuilder().build();
      expect(a.isActive).toBe(true);
      a.revoke();
      expect(a.isActive).toBe(false);
    });
  });

  it('hidrata desde persistencia conservando estado y scope', () => {
    const grantedAt = new Date('2026-01-01T00:00:00.000Z');
    const a = RoleAssignment.fromPersistence({
      id: 'a3',
      userId: 'u9',
      roleId: 'r9',
      companyId: null,
      localId: 'l5',
      isActive: false,
      grantedAt,
      grantedBy: 'x',
    });
    expect(a.userId).toBe('u9');
    expect(a.roleId).toBe('r9');
    expect(a.localId).toBe('l5');
    expect(a.isActive).toBe(false);
    expect(a.grantedAt).toEqual(grantedAt);
    expect(a.grantedBy).toBe('x');
  });
});
