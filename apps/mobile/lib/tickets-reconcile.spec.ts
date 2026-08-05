import type { TicketResponse } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { reconcileTickets } from './tickets-reconcile';

function ticket(id: string): TicketResponse {
  return {
    id,
    eventId: '11111111-1111-1111-1111-111111111111',
    ticketTypeId: '22222222-2222-2222-2222-222222222222',
    qrCode: `token-${id}`,
    qrImageKey: null,
    status: 'valid',
    issuedAt: '2026-08-01T00:00:00.000Z',
    attendeeName: 'Ana Torres',
    eventName: 'Noche RAVENUE',
    eventStartsAt: '2026-08-09T03:00:00.000Z',
    eventFlyerKey: null,
    venueName: 'Bunker',
    ticketTypeName: 'General',
  };
}

describe('reconcileTickets', () => {
  it('inserta las entradas nuevas', () => {
    const res = reconcileTickets([], [ticket('a'), ticket('b')]);
    expect(res.upsert.map((t) => t.id)).toEqual(['a', 'b']);
    expect(res.deleteIds).toEqual([]);
  });

  it('borra de la caché lo que el backend ya no devuelve', () => {
    const res = reconcileTickets(['a', 'b'], [ticket('a')]);
    expect(res.upsert.map((t) => t.id)).toEqual(['a']);
    expect(res.deleteIds).toEqual(['b']);
  });

  it('sobrescribe siempre lo cacheado: el backend manda', () => {
    const used = { ...ticket('a'), status: 'used' as const };
    const res = reconcileTickets(['a'], [used]);
    expect(res.upsert[0]?.status).toBe('used');
  });

  it('vacía la caché si el backend devuelve una lista vacía', () => {
    const res = reconcileTickets(['a', 'b'], []);
    expect(res.upsert).toEqual([]);
    expect(res.deleteIds).toEqual(['a', 'b']);
  });
});
