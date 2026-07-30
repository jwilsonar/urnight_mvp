import type {
  InventoryPort,
  SaleEvent,
  SaleTicketType,
} from '../../../../modules/ticketing/domain/ports/inventory.repository';

/** Contadores de check-in por evento (replica events.checkins_count). */
interface EventCounters {
  ticketsSold: number;
  checkins: number;
}

/**
 * InventoryPort en memoria. Replica la doble barrera anti-sobreventa: el método
 * `incrementSold` lanza (como la CHECK `sold <= stock` de Postgres) si la venta
 * superaría el stock, abortando la "Tx". Precarga datos con `seedEvent` /
 * `seedTicketType`. NUNCA se mockea el ORM (estrategia de testing UrNight).
 */
export class InMemoryInventoryRepository implements InventoryPort {
  private readonly events = new Map<string, SaleEvent>();
  private readonly ticketTypes = new Map<string, SaleTicketType>();
  private readonly counters = new Map<string, EventCounters>();

  /** Precarga un evento vendible. */
  seedEvent(event: SaleEvent): this {
    this.events.set(event.id, event);
    if (!this.counters.has(event.id)) this.counters.set(event.id, { ticketsSold: 0, checkins: 0 });
    return this;
  }

  /** Precarga un tipo de entrada (stock/sold). */
  seedTicketType(ticketType: SaleTicketType): this {
    this.ticketTypes.set(ticketType.id, ticketType);
    return this;
  }

  /** Stock vendido actual de un tipo de entrada (aserciones). */
  soldOf(ticketTypeId: string): number {
    return this.ticketTypes.get(ticketTypeId)?.sold ?? 0;
  }

  /** Contadores de un evento (tickets vendidos / check-ins) para aserciones. */
  countersOf(eventId: string): EventCounters {
    return this.counters.get(eventId) ?? { ticketsSold: 0, checkins: 0 };
  }

  async getEvent(eventId: string): Promise<SaleEvent | null> {
    return this.events.get(eventId) ?? null;
  }

  async getTicketType(id: string, _tx?: unknown): Promise<SaleTicketType | null> {
    const tt = this.ticketTypes.get(id);
    return tt ? { ...tt } : null;
  }

  async lockTicketTypes(_ids: string[], _tx: unknown): Promise<void> {}

  async incrementSold(ticketTypeId: string, qty: number, _tx: unknown): Promise<void> {
    const tt = this.ticketTypes.get(ticketTypeId);
    if (!tt) throw new Error(`InMemoryInventory: tipo de entrada ${ticketTypeId} no existe`);
    // Barrera CHECK (sold <= stock): aborta la Tx si la venta sobrevende.
    if (tt.sold + qty > tt.stock) {
      throw new Error('InMemoryInventory: violación de CHECK sold <= stock (sobreventa)');
    }
    tt.sold += qty;
    tt.available = Math.max(tt.stock - tt.sold, 0);
  }

  async incrementEventTicketsSold(eventId: string, qty: number, _tx: unknown): Promise<void> {
    const c = this.counters.get(eventId) ?? { ticketsSold: 0, checkins: 0 };
    c.ticketsSold += qty;
    this.counters.set(eventId, c);
  }

  async incrementEventCheckins(eventId: string, _tx?: unknown): Promise<void> {
    const c = this.counters.get(eventId) ?? { ticketsSold: 0, checkins: 0 };
    c.checkins += 1;
    this.counters.set(eventId, c);
  }
}
