import { PromoCode } from "../../../../modules/promoters/domain/entities/promo-code.entity";
import type {
  GeneratedRedemptionCodeInput,
  PromoOrderAttribution,
  PromoCodeRepository,
  PromoRedemptionRecord,
  RedemptionCodeView,
  ResolvedRedemptionCodeView,
} from "../../../../modules/promoters/domain/ports/promo-code.repository";
import { InMemoryRepository } from "../in-memory.repository";

/** PromoCodeRepository en memoria. Busca por `code` (índice único en la DB). */
export class InMemoryPromoCodeRepository
  extends InMemoryRepository<PromoCode>
  implements PromoCodeRepository
{
  /** Precarga un código sin pasar por un caso de uso. */
  seed(promoCode: PromoCode): this {
    this.put(promoCode);
    return this;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    return this.values().find((p) => p.code === code) ?? null;
  }

  async findAttributionByOrder(
    orderId: string,
  ): Promise<PromoOrderAttribution | null> {
    const redemption = this.redemptions.find((row) => row.orderId === orderId);
    if (!redemption) return null;
    const generated = this.generated.get(redemption.promoCodeId);
    return {
      promoCodeId: redemption.promoCodeId,
      promoterId: generated?.promoterId ?? null,
    };
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.values().some((p) => p.code === code);
  }

  async create(promoCode: PromoCode): Promise<PromoCode> {
    this.put(promoCode);
    return promoCode;
  }

  private readonly redemptions: PromoRedemptionRecord[] = [];
  private readonly generated = new Map<string, GeneratedRedemptionCodeInput>();

  async createGenerated(
    input: GeneratedRedemptionCodeInput,
    _tx?: unknown,
  ): Promise<void> {
    this.generated.set(input.id, input);
    this.put(
      PromoCode.create({
        id: input.id,
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        usageQuota: 1,
        scope: "ticket_type",
        eventId: input.eventId,
        ticketTypeId: input.ticketTypeId,
      }),
    );
  }

  async incrementClicks(_code: string): Promise<void> {
    // El aggregate no expone mutador de clicks; no-op en memoria.
  }

  async deactivateUnredeemedByPromoterEvent(
    promoterEventId: string,
    _tx?: unknown,
  ): Promise<void> {
    for (const [id, g] of this.generated) {
      if (g.promoterEventId === promoterEventId) this.generated.delete(id);
    }
  }

  async countByAllocation(
    promoterEventId: string,
    ticketTypeId: string,
  ): Promise<number> {
    return [...this.generated.values()].filter(
      (g) =>
        g.promoterEventId === promoterEventId &&
        g.ticketTypeId === ticketTypeId,
    ).length;
  }

  async listByPromoterEvent(
    promoterEventId: string,
  ): Promise<RedemptionCodeView[]> {
    return [...this.generated.values()]
      .filter((g) => g.promoterEventId === promoterEventId)
      .map((g) => ({
        id: g.id,
        code: g.code,
        ticketTypeId: g.ticketTypeId,
        ticketTypeName: null,
        discountType: g.discountType,
        discountValue: g.discountValue,
        usageQuota: 1,
        usedCount: 0,
        clicks: 0,
        isActive: true,
        validUntil: null,
        createdAt: new Date(),
      }));
  }

  async resolveView(code: string): Promise<ResolvedRedemptionCodeView | null> {
    const promo = this.values().find((p) => p.code === code.toUpperCase());
    if (!promo) return null;
    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      usageQuota: promo.usageQuota,
      usedCount: promo.usedCount,
      isActive: promo.isActive,
      validUntil: null,
      promoterName: null,
      event: null,
      ticketType: null,
    };
  }

  async incrementUsedCount(_id: string, _tx?: unknown): Promise<void> {
    // El aggregate PromoCode no expone mutador de usedCount; no-op en memoria.
  }

  async recordRedemption(
    record: PromoRedemptionRecord,
    _tx?: unknown,
  ): Promise<void> {
    this.redemptions.push(record);
  }

  async listRedemptionsByCode(
    promoCodeId: string,
  ): Promise<PromoRedemptionRecord[]> {
    return this.redemptions.filter((r) => r.promoCodeId === promoCodeId);
  }

  async listRedemptionsByUser(
    userId: string,
  ): Promise<PromoRedemptionRecord[]> {
    return this.redemptions.filter((r) => r.userId === userId);
  }
}
