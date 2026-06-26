export type PromoterEventStatus = 'active' | 'revoked';
export type AllocationDiscountType = 'percentage' | 'fixed_amount';

/** Descuento + cupo de un tipo de entrada dentro de una asignación. */
export interface PromoterAllocationProps {
  ticketTypeId: string;
  discountType: AllocationDiscountType;
  discountValue: number;
  allocatedStock: number;
}

export interface PromoterEventProps {
  id: string;
  promoterId: string;
  eventId: string;
  status: PromoterEventStatus;
  assignedBy: string | null;
  allocations: PromoterAllocationProps[];
  createdAt: Date;
}

/**
 * Aggregate PromoterEvent: asignación de un evento a un promotor con descuento y
 * cupo (`allocated_stock`) por tipo de entrada. El cupo acota cuántos códigos
 * single-use puede generar el promotor para cada tipo.
 */
export class PromoterEvent {
  private constructor(private readonly props: PromoterEventProps) {}

  static create(input: {
    id: string;
    promoterId: string;
    eventId: string;
    assignedBy: string | null;
    allocations: PromoterAllocationProps[];
  }): PromoterEvent {
    return new PromoterEvent({
      id: input.id,
      promoterId: input.promoterId,
      eventId: input.eventId,
      status: 'active',
      assignedBy: input.assignedBy,
      allocations: input.allocations,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: PromoterEventProps): PromoterEvent {
    return new PromoterEvent(props);
  }

  get id(): string {
    return this.props.id;
  }
  get promoterId(): string {
    return this.props.promoterId;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get status(): PromoterEventStatus {
    return this.props.status;
  }
  get assignedBy(): string | null {
    return this.props.assignedBy;
  }
  get allocations(): PromoterAllocationProps[] {
    return this.props.allocations;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
