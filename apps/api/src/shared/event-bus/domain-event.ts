/** Evento de dominio base. Los módulos publican subtipos (p.ej. OrderPaid). */
export interface DomainEvent<TPayload = unknown> {
  readonly name: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}

export type DomainEventHandler<E extends DomainEvent = DomainEvent> = (
  event: E,
) => void | Promise<void>;
