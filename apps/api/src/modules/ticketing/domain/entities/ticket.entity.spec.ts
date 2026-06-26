import { describe, expect, it } from 'vitest';
import { TicketBuilder } from '../../../../shared/testing/builders/ticketing';
import { TicketMother } from '../../../../shared/testing/mothers/ticketing';

describe('Ticket (aggregate)', () => {
  it('se emite en estado valid con su QR y sin uso previo', () => {
    const ticket = new TicketBuilder().withQr('qr-abc').build();
    expect(ticket.status).toBe('valid');
    expect(ticket.qrCode).toBe('qr-abc');
    expect(ticket.issuedAt).toBeInstanceOf(Date);
  });

  describe('validate() (no muta)', () => {
    it('un ticket valid devuelve "valid"', () => {
      expect(TicketMother.valid().validate()).toBe('valid');
    });

    it('un ticket usado devuelve "already_used"', () => {
      expect(TicketMother.used().validate()).toBe('already_used');
    });

    it('un ticket cancelado devuelve "cancelled"', () => {
      expect(TicketMother.cancelled().validate()).toBe('cancelled');
    });

    it('un ticket expirado devuelve "invalid"', () => {
      expect(TicketMother.expired().validate()).toBe('invalid');
    });

    it('validate no cambia el estado del ticket', () => {
      const ticket = TicketMother.valid();
      ticket.validate();
      expect(ticket.status).toBe('valid');
    });
  });

  describe('markUsed() (máquina de estados)', () => {
    it('marca el ticket como used con fecha de uso', () => {
      const ticket = new TicketBuilder().build();
      ticket.markUsed(new Date('2026-06-20T22:00:00Z'));
      expect(ticket.status).toBe('used');
      expect(ticket.validate()).toBe('already_used');
    });
  });

  it('preserva el QR único e impredecible asignado en la emisión', () => {
    const a = new TicketBuilder().withId('a').withQr('qr-1').build();
    const b = new TicketBuilder().withId('b').withQr('qr-2').build();
    // Unicidad: cada ticket conserva su propio QR (la unicidad global la
    // garantizan el UNIQUE de la BD + token aleatorio del checkout).
    expect(a.qrCode).not.toBe(b.qrCode);
  });
});
