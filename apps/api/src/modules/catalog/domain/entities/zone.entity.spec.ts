import { describe, expect, it } from 'vitest';
import { Zone } from './zone.entity';

describe('Zone (domain)', () => {
  const base = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Centro',
    slug: 'centro',
    displayOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('reconstituye desde persistencia y expone getters', () => {
    const zone = Zone.fromPersistence(base);
    expect(zone.id).toBe(base.id);
    expect(zone.name).toBe('Centro');
    expect(zone.isActive).toBe(true);
  });

  it('rechaza un name inválido (invariante de dominio)', () => {
    expect(() => Zone.fromPersistence({ ...base, name: 'x' })).toThrow();
  });
});
