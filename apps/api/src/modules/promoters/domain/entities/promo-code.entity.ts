export type DiscountType = 'percentage' | 'fixed_amount';
export type PromoScope = 'global' | 'event' | 'local' | 'zone' | 'promoter' | 'ticket_type';

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface PromoCodeProps {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageQuota: number | null;
  usedCount: number;
  validFrom: Date | null;
  validUntil: Date | null;
  scope: PromoScope;
  eventId: string | null;
  localId: string | null;
  ticketTypeId: string | null;
  isActive: boolean;
}

export interface PromoContext {
  subtotal: number;
  eventId?: string;
  localId?: string;
  /** Líneas de la orden (para códigos con scope `ticket_type`: base = línea del tipo). */
  items?: { ticketTypeId: string; lineTotal: number }[];
  now?: Date;
}

/** Aggregate PromoCode (§4.1). Reglas de validez + cálculo de descuento. */
export class PromoCode {
  private constructor(private readonly props: PromoCodeProps) {}

  static create(input: {
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    usageQuota?: number | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
    scope: PromoScope;
    eventId?: string | null;
    localId?: string | null;
    ticketTypeId?: string | null;
  }): PromoCode {
    return new PromoCode({
      id: input.id,
      code: input.code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      usageQuota: input.usageQuota ?? null,
      usedCount: 0,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      scope: input.scope,
      eventId: input.eventId ?? null,
      localId: input.localId ?? null,
      ticketTypeId: input.ticketTypeId ?? null,
      isActive: true,
    });
  }

  static fromPersistence(props: PromoCodeProps): PromoCode {
    return new PromoCode(props);
  }

  /** ¿El código aplica a este contexto? (vigencia + cupo + scope). */
  isValid(ctx: PromoContext): { valid: boolean; reason: string | null } {
    const now = ctx.now ?? new Date();
    if (!this.props.isActive) return { valid: false, reason: 'Código inactivo' };
    if (this.props.validFrom && now < this.props.validFrom) return { valid: false, reason: 'Aún no vigente' };
    if (this.props.validUntil && now > this.props.validUntil) return { valid: false, reason: 'Código expirado' };
    if (this.props.usageQuota !== null && this.props.usedCount >= this.props.usageQuota) {
      return { valid: false, reason: 'Cupo agotado' };
    }
    if (this.props.scope === 'event' && this.props.eventId !== (ctx.eventId ?? null)) {
      return { valid: false, reason: 'No aplica a este evento' };
    }
    if (this.props.scope === 'local' && this.props.localId !== (ctx.localId ?? null)) {
      return { valid: false, reason: 'No aplica a este local' };
    }
    if (this.props.scope === 'ticket_type') {
      if (this.props.eventId && this.props.eventId !== (ctx.eventId ?? null)) {
        return { valid: false, reason: 'No aplica a este evento' };
      }
      // Si conocemos las líneas (checkout), el tipo del código debe estar en la orden.
      if (ctx.items && !ctx.items.some((i) => i.ticketTypeId === this.props.ticketTypeId)) {
        return { valid: false, reason: 'No aplica a este tipo de entrada' };
      }
    }
    return { valid: true, reason: null };
  }

  /**
   * Descuento aplicado. Para scope `ticket_type` la base es la línea del tipo
   * (no el subtotal completo); para el resto, el subtotal. 100% ⇒ entrada gratis.
   */
  computeDiscount(ctx: PromoContext): number {
    const base = this.baseAmount(ctx);
    const raw =
      this.props.discountType === 'percentage'
        ? (base * this.props.discountValue) / 100
        : Math.min(this.props.discountValue, base);
    return round2(Math.min(raw, base));
  }

  private baseAmount(ctx: PromoContext): number {
    if (this.props.scope === 'ticket_type' && ctx.items) {
      const line = ctx.items.find((i) => i.ticketTypeId === this.props.ticketTypeId);
      if (line) return line.lineTotal;
    }
    return ctx.subtotal;
  }

  get id(): string {
    return this.props.id;
  }
  get code(): string {
    return this.props.code;
  }
  get discountType(): DiscountType {
    return this.props.discountType;
  }
  get discountValue(): number {
    return this.props.discountValue;
  }
  get scope(): PromoScope {
    return this.props.scope;
  }
  get ticketTypeId(): string | null {
    return this.props.ticketTypeId;
  }
  get usageQuota(): number | null {
    return this.props.usageQuota;
  }
  get usedCount(): number {
    return this.props.usedCount;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
}
