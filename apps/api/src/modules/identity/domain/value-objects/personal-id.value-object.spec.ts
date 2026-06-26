import { describe, expect, it } from 'vitest';
import { PersonalId } from './personal-id.value-object';
import { UnderageError } from '../errors/identity.errors';

describe('PersonalId (value object)', () => {
  const adult = { documentType: 'dni' as const, documentNumber: '12345678', birthDate: new Date('2000-01-01') };

  it('crea una identidad válida de adulto', () => {
    const id = PersonalId.create(adult);
    expect(id.documentNumber).toBe('12345678');
    expect(id.isAdult()).toBe(true);
  });

  it('rechaza a un menor de 18 con UnderageError tipado (invariante §4.3)', () => {
    expect(() => PersonalId.create({ ...adult, birthDate: new Date('2015-01-01') })).toThrow(
      UnderageError,
    );
  });

  it('rechaza un número de documento con formato inválido', () => {
    expect(() => PersonalId.create({ ...adult, documentNumber: 'abc' })).toThrow();
  });

  it('compara por tipo+número (equals)', () => {
    const a = PersonalId.create(adult);
    const b = PersonalId.create({ ...adult, birthDate: new Date('1999-05-05') });
    expect(a.equals(b)).toBe(true);
  });

  it('rechaza un documentType inválido', () => {
    // @ts-expect-error tipo inválido a propósito (barrera de dominio)
    expect(() => PersonalId.create({ ...adult, documentType: 'rut' })).toThrow();
  });

  it('rechaza una fecha de nacimiento inválida (NaN)', () => {
    expect(() => PersonalId.create({ ...adult, birthDate: new Date('not-a-date') })).toThrow();
  });
});
