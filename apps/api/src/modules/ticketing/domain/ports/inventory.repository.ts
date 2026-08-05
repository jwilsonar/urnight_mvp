/**
 * Puerto de inventario: acceso de checkout a event/ticket_type para venta y stock.
 * Acoplamiento a nivel de persistencia (misma DB); el dominio de checkout no
 * importa el módulo Events. Doble barrera anti-sobreventa: lock + CHECK + Tx.
 */
export interface SaleEvent {
  id: string;
  status: string;
  localId: string;
  /** Empresa dueña del local (C1: control multi-tenant derivado del evento). */
  companyId: string;
  isOnSale: boolean;
}

export interface SaleTicketType {
  id: string;
  eventId: string;
  price: number;
  currency: string;
  stock: number;
  sold: number;
  available: number;
  maxPerUser: number | null;
  status: string;
}

export interface InventoryPort {
  getEvent(eventId: string): Promise<SaleEvent | null>;
  /** Lee un tipo de entrada. `tx`: dentro de la Tx de checkout (re-verificación M2). */
  getTicketType(id: string, tx?: unknown): Promise<SaleTicketType | null>;
  /** Serializa operaciones concurrentes por tipo de entrada mediante row locks de Postgres. */
  lockTicketTypes(ids: string[], tx: unknown): Promise<void>;
  /** Incrementa sold; la CHECK (sold<=stock) revierte la Tx si hay sobreventa. */
  incrementSold(ticketTypeId: string, qty: number, tx: unknown): Promise<void>;
  incrementEventTicketsSold(eventId: string, qty: number, tx: unknown): Promise<void>;
  incrementEventCheckins(eventId: string, tx?: unknown): Promise<void>;
}

export const INVENTORY_PORT = Symbol('INVENTORY_PORT');
