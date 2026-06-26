import { describe, expect, it } from 'vitest';
import { AttendeeBuilder } from '../../../../shared/testing/builders/ticketing';
import { AttendeeMother } from '../../../../shared/testing/mothers/ticketing';
import { Attendee } from './attendee.entity';
import { AttendeeUnderageError } from '../errors/checkout.errors';

describe('Attendee (entidad)', () => {
  it('crea un asistente adulto válido', () => {
    const attendee = new AttendeeBuilder().asAdult(30).withFullName('Grace Hopper').build();
    expect(attendee.fullName).toBe('Grace Hopper');
    expect(attendee.isBuyer).toBe(false);
    expect(attendee.documentType).toBe('dni');
  });

  it('normaliza (trim) el nombre completo', () => {
    const attendee = new AttendeeBuilder().withFullName('  Ada Lovelace  ').build();
    expect(attendee.fullName).toBe('Ada Lovelace');
  });

  it('marca al comprador como asistente (buyer-is-attendee)', () => {
    const attendee = AttendeeMother.buyer();
    expect(attendee.isBuyer).toBe(true);
  });

  it('rechaza un asistente menor de 18 con AttendeeUnderageError tipado (invariante 18+)', () => {
    expect(() => new AttendeeBuilder().asMinor(16).build()).toThrow(AttendeeUnderageError);
  });

  it('rechaza a quien cumple 18 mañana (aún 17, borde de edad)', () => {
    const tomorrow = new Date();
    tomorrow.setFullYear(tomorrow.getFullYear() - 18);
    tomorrow.setDate(tomorrow.getDate() + 1); // cumple 18 mañana → hoy es menor
    const props = new AttendeeBuilder().withBirthDate(tomorrow).buildProps();
    expect(() => Attendee.create(props)).toThrow(AttendeeUnderageError);
  });

  it('acepta a quien cumplió 18 ayer (borde de edad)', () => {
    const yesterday = new Date();
    yesterday.setFullYear(yesterday.getFullYear() - 18);
    yesterday.setDate(yesterday.getDate() - 1); // cumplió 18 ayer → adulto
    const attendee = new AttendeeBuilder().withBirthDate(yesterday).build();
    expect(attendee.birthDate).toBeInstanceOf(Date);
  });
});
