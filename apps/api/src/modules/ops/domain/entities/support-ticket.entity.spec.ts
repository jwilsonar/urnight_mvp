import { describe, expect, it } from 'vitest';
import { SupportTicket, type SupportStatus } from './support-ticket.entity';
import { SupportTicketBuilder } from '../../../../shared/testing/builders/ops';
import { SupportTicketMother } from '../../../../shared/testing/mothers/ops';

describe('SupportTicket (domain §4.1)', () => {
  it('abre un ticket en estado "open" con los datos provistos', () => {
    const ticket = SupportTicket.open({
      id: 't1',
      ticketCode: 'SUP-ABC123',
      openedBy: 'user-1',
      localId: 'local-1',
      subject: 'No puedo validar mi QR',
      description: 'Falla al escanear',
      category: 'incident',
      priority: 'high',
    });
    expect(ticket.id).toBe('t1');
    expect(ticket.ticketCode).toBe('SUP-ABC123');
    expect(ticket.openedBy).toBe('user-1');
    expect(ticket.localId).toBe('local-1');
    expect(ticket.subject).toBe('No puedo validar mi QR');
    expect(ticket.description).toBe('Falla al escanear');
    expect(ticket.category).toBe('incident');
    expect(ticket.priority).toBe('high');
    expect(ticket.status).toBe('open');
    expect(ticket.createdAt).toBeInstanceOf(Date);
  });

  it('normaliza el subject (trim) y aplica defaults null', () => {
    const ticket = SupportTicket.open({
      id: 't1',
      ticketCode: 'SUP-XYZ',
      openedBy: null,
      subject: '   Consulta general   ',
      category: 'request',
      priority: 'low',
    });
    expect(ticket.subject).toBe('Consulta general');
    expect(ticket.openedBy).toBeNull();
    expect(ticket.localId).toBeNull();
    expect(ticket.description).toBeNull();
  });

  // Invariante §4.1: workflow open → in_progress → resolved → closed.
  it('recorre el workflow de estados open → in_progress → resolved → closed', () => {
    const ticket = SupportTicketMother.open();
    expect(ticket.status).toBe('open');

    const flow: SupportStatus[] = ['in_progress', 'resolved', 'closed'];
    for (const next of flow) {
      ticket.changeStatus(next);
      expect(ticket.status).toBe(next);
    }
  });

  it('changeStatus actualiza el estado al valor indicado', () => {
    const ticket = SupportTicketMother.open();
    ticket.changeStatus('in_progress');
    expect(ticket.status).toBe('in_progress');
  });

  it('reconstituye desde persistencia conservando el estado guardado', () => {
    const ticket = SupportTicket.fromPersistence({
      id: 't1',
      ticketCode: 'SUP-AAA',
      openedBy: 'user-1',
      localId: null,
      subject: 'Asunto',
      description: null,
      category: 'bug',
      status: 'resolved',
      priority: 'medium',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    expect(ticket.status).toBe('resolved');
    expect(ticket.category).toBe('bug');
    expect(ticket.priority).toBe('medium');
  });

  it('el builder produce un ticket "open" por defecto', () => {
    const ticket = new SupportTicketBuilder().build();
    expect(ticket.status).toBe('open');
    expect(ticket.category).toBe('incident');
  });

  it('los mothers exponen cada estado del workflow', () => {
    expect(SupportTicketMother.open().status).toBe('open');
    expect(SupportTicketMother.inProgress().status).toBe('in_progress');
    expect(SupportTicketMother.resolved().status).toBe('resolved');
    expect(SupportTicketMother.closed().status).toBe('closed');
  });
});
