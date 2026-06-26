/** Descuento calculado para una orden a partir de un código promocional. */
export interface PromoApplication {
  promoCodeId: string;
  discount: number;
}

/** Contexto de aplicación del promo en checkout. */
export interface PromoApplyContext {
  code: string;
  userId: string;
  eventId: string;
  localId?: string;
  subtotal: number;
  /** Líneas de la orden — necesarias para códigos con scope `ticket_type`. */
  items?: { ticketTypeId: string; lineTotal: number }[];
}

/**
 * Puerto público de Promoters consumido por Ticketing (§3.2: cross-module SOLO
 * por puerto público). `preview` valida + calcula descuento (sin efectos; lanza
 * si el código es inválido). `redeem` registra el canje e incrementa el uso en
 * la misma Tx del checkout.
 */
export abstract class PromoRedemptionPort {
  abstract preview(ctx: PromoApplyContext): Promise<PromoApplication>;
  abstract redeem(
    input: { promoCodeId: string; orderId: string; userId: string; discount: number },
    tx?: unknown,
  ): Promise<void>;
}
