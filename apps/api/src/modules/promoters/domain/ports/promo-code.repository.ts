import type { DiscountType, PromoCode } from '../entities/promo-code.entity';

/** Fila de canje (PROMO_CODE_REDEMPTION §4.1). */
export interface PromoRedemptionRecord {
  id: string;
  promoCodeId: string;
  orderId: string;
  userId: string;
  discountApplied: number;
  redeemedAt: Date;
}

/** Alta de un código de canje single-use generado por un promotor (scope `ticket_type`). */
export interface GeneratedRedemptionCodeInput {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  eventId: string;
  ticketTypeId: string;
  promoterId: string;
  promoterEventId: string;
  createdBy: string | null;
}

/** Proyección de lectura de un código de canje (tabla "Gestionar"). */
export interface RedemptionCodeView {
  id: string;
  code: string;
  ticketTypeId: string | null;
  ticketTypeName: string | null;
  discountType: DiscountType;
  discountValue: number;
  usageQuota: number | null;
  usedCount: number;
  clicks: number;
  isActive: boolean;
  validUntil: Date | null;
  createdAt: Date;
}

/** Proyección de lectura para resolver un código de canje en la landing `/p/<code>`. */
export interface ResolvedRedemptionCodeView {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageQuota: number | null;
  usedCount: number;
  isActive: boolean;
  validUntil: Date | null;
  promoterName: string | null;
  event: { id: string; slug: string; name: string; startsAt: Date; flyerUrl: string | null } | null;
  ticketType: { id: string; name: string; price: number; currency: string } | null;
}

export interface PromoCodeRepository {
  findByCode(code: string): Promise<PromoCode | null>;
  existsByCode(code: string): Promise<boolean>;
  create(promoCode: PromoCode): Promise<PromoCode>;
  /** Inserta un código de canje single-use generado por un promotor (todas las FKs + cupo=1). */
  createGenerated(input: GeneratedRedemptionCodeInput, tx?: unknown): Promise<void>;
  /** Incrementa el contador de usos (en la Tx del checkout). */
  incrementUsedCount(id: string, tx?: unknown): Promise<void>;
  /** Incrementa los clics del enlace corto `/p/<code>` (público). */
  incrementClicks(code: string): Promise<void>;
  /** Códigos ya generados para una allocation (promoter_event + ticket_type). */
  countByAllocation(promoterEventId: string, ticketTypeId: string): Promise<number>;
  /** Códigos de canje de una asignación, con nombre del tipo de entrada (read-model). */
  listByPromoterEvent(promoterEventId: string): Promise<RedemptionCodeView[]>;
  /** Datos de aterrizaje de un código de canje (join promoter/event/ticket_type). */
  resolveView(code: string): Promise<ResolvedRedemptionCodeView | null>;
  /**
   * Desactiva los códigos NO canjeados (used_count = 0) de una asignación, al
   * desasignar el evento. Los ya canjeados quedan intactos.
   */
  deactivateUnredeemedByPromoterEvent(promoterEventId: string, tx?: unknown): Promise<void>;
  /** Persiste un canje (en la Tx del checkout). */
  recordRedemption(record: PromoRedemptionRecord, tx?: unknown): Promise<void>;
  listRedemptionsByCode(promoCodeId: string): Promise<PromoRedemptionRecord[]>;
  listRedemptionsByUser(userId: string): Promise<PromoRedemptionRecord[]>;
}

export const PROMO_CODE_REPOSITORY = Symbol('PROMO_CODE_REPOSITORY');
