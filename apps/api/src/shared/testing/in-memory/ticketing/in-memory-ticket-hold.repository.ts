import { availableCapacity } from '@urnight/db';
import {
  TicketHold,
  type TicketHoldProps,
} from '../../../../modules/ticketing/domain/entities/ticket-hold.entity';
import type { TicketHoldRepository } from '../../../../modules/ticketing/domain/ports/ticket-hold.repository';

interface CapacitySeed {
  stock: number;
  sold: number;
}

/** Repositorio de holds en memoria con la misma semántica temporal que Postgres. */
export class InMemoryTicketHoldRepository implements TicketHoldRepository {
  readonly all: TicketHold[] = [];
  private readonly capacities = new Map<string, CapacitySeed>();

  seedCapacity(ticketTypeId: string, capacity: CapacitySeed): this {
    this.capacities.set(ticketTypeId, { ...capacity });
    return this;
  }

  seedActive(input: {
    id: string;
    eventId: string;
    ticketTypeId: string;
    userId: string;
    quantity: number;
    expiresAt: Date;
  }): this {
    const createdAt = new Date(input.expiresAt.getTime() - 10 * 60 * 1000);
    this.all.push(
      TicketHold.fromPersistence({
        ...input,
        orderId: null,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      }),
    );
    return this;
  }

  byId(id: string): TicketHold | undefined {
    return this.all.find((hold) => hold.id === id);
  }

  async create(hold: TicketHold, _tx?: unknown): Promise<TicketHold> {
    this.all.push(hold);
    return hold;
  }

  async findById(id: string, _tx?: unknown): Promise<TicketHold | null> {
    return this.byId(id) ?? null;
  }

  async findByIdForUpdate(id: string, _tx: unknown): Promise<TicketHold | null> {
    return this.findById(id);
  }

  async update(hold: TicketHold, _tx?: unknown): Promise<TicketHold> {
    const index = this.all.findIndex((candidate) => candidate.id === hold.id);
    if (index < 0) throw new Error(`InMemoryTicketHold: hold ${hold.id} no existe`);
    this.all[index] = hold;
    return hold;
  }

  async availableCapacity(
    ticketTypeId: string,
    at: Date,
    _tx?: unknown,
  ): Promise<number> {
    const capacity = this.capacities.get(ticketTypeId);
    if (!capacity) return 0;
    const activeHolds = this.all
      .filter(
        (hold) =>
          hold.ticketTypeId === ticketTypeId &&
          hold.status === 'active' &&
          hold.expiresAt > at,
      )
      .reduce((total, hold) => total + hold.quantity, 0);
    return availableCapacity(capacity.stock, capacity.sold, activeHolds);
  }

  async expireStale(at: Date, _tx?: unknown): Promise<number> {
    let expired = 0;
    for (const hold of this.all) {
      if (hold.status === 'active' && hold.expiresAt <= at) {
        hold.expire(at);
        expired += 1;
      }
    }
    return expired;
  }
}

export type InMemoryTicketHoldSeed = TicketHoldProps;
