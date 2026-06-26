import { describe, expect, it } from 'vitest';
import { PersonalId } from '../value-objects/personal-id.value-object';
import { User } from './user.entity';
import { UserBuilder } from '../../../../shared/testing';

const identity = PersonalId.create({
  documentType: 'dni',
  documentNumber: '12345678',
  birthDate: new Date('2000-01-01'),
});

describe('User (aggregate)', () => {
  it('registra con email: no verificado, activo, proveedor email', () => {
    const user = User.registerWithEmail({
      id: 'u1',
      fullName: 'Ada Lovelace',
      email: 'ADA@example.com',
      passwordHash: 'hashed:secret',
      identity,
    });
    expect(user.email).toBe('ada@example.com');
    expect(user.emailVerified).toBe(false);
    expect(user.isActive).toBe(true);
    expect(user.authProvider).toBe('email');
    expect(user.identity).not.toBeNull();
  });

  it('registra con Google: email ya verificado, sin contraseña', () => {
    const user = User.registerWithGoogle({
      id: 'u2',
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      googleSub: 'sub-123',
    });
    expect(user.emailVerified).toBe(true);
    expect(user.passwordHash).toBeNull();
    expect(user.identity).toBeNull();
  });

  it('documento inmutable: assignIdentity falla si ya hay identidad', () => {
    const user = User.registerWithGoogle({
      id: 'u3',
      fullName: 'X',
      email: 'x@example.com',
      googleSub: 's',
    });
    user.assignIdentity(identity);
    expect(() => user.assignIdentity(identity)).toThrow();
  });

  it('markEmailVerified y linkGoogle mutan el estado', () => {
    const user = User.registerWithEmail({
      id: 'u4',
      fullName: 'Y',
      email: 'y@example.com',
      passwordHash: 'h',
      identity,
    });
    user.markEmailVerified();
    user.linkGoogle('sub-xyz');
    expect(user.emailVerified).toBe(true);
    expect(user.googleSub).toBe('sub-xyz');
  });

  it('recordLogin actualiza lastLoginAt', () => {
    const user = new UserBuilder().build();
    expect(user.lastLoginAt).toBeNull();
    const at = new Date('2026-06-20T00:00:00.000Z');
    user.recordLogin(at);
    expect(user.lastLoginAt).toEqual(at);
  });

  it('deactivate desactiva la cuenta', () => {
    const user = new UserBuilder().build();
    expect(user.isActive).toBe(true);
    user.deactivate();
    expect(user.isActive).toBe(false);
  });

  it('expone todos los getters del aggregate', () => {
    const user = new UserBuilder()
      .withId('uX')
      .withFullName('Marie Curie')
      .withEmail('marie@example.com')
      .build();
    expect(user.id).toBe('uX');
    expect(user.fullName).toBe('Marie Curie');
    expect(user.phone).toBeNull();
    expect(user.avatarUrl).toBeNull();
    expect(user.passwordHash).toBe('hashed:supersecret');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
