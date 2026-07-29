import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  event,
  local,
  promoCode,
  promoCodeRedemption,
  promoter,
  ticketType,
} from "@urnight/db";
import {
  DRIZZLE,
  type DrizzleDb,
} from "../../../../shared/database/drizzle.constants";
import type { Tx } from "../../../../shared/unit-of-work/unit-of-work";
import {
  PromoCodeAlreadyRedeemedError,
  PromoCodeQuotaExhaustedError,
} from "../../domain/errors/promoters.errors";
import {
  PromoCode,
  type DiscountType,
  type PromoScope,
} from "../../domain/entities/promo-code.entity";

/** ¿El error de la BD es una violación de UNIQUE/PK (Postgres 23505)? */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}
import type {
  GeneratedRedemptionCodeInput,
  PromoOrderAttribution,
  PromoCodeRepository,
  PromoRedemptionRecord,
  RedemptionCodeView,
  ResolvedRedemptionCodeView,
} from "../../domain/ports/promo-code.repository";

type Row = typeof promoCode.$inferSelect;
type RedemptionRow = typeof promoCodeRedemption.$inferSelect;

function toRedemptionRecord(row: RedemptionRow): PromoRedemptionRecord {
  return {
    id: row.id,
    promoCodeId: row.promoCodeId,
    orderId: row.orderId,
    userId: row.userId,
    discountApplied: Number(row.discountApplied),
    redeemedAt: row.redeemedAt,
  };
}

@Injectable()
export class DrizzlePromoCodeRepository implements PromoCodeRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByCode(code: string): Promise<PromoCode | null> {
    const [row] = await this.db
      .select()
      .from(promoCode)
      .where(eq(promoCode.code, code.toUpperCase()))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findAttributionByOrder(
    orderId: string,
  ): Promise<PromoOrderAttribution | null> {
    const [row] = await this.db
      .select({
        promoCodeId: promoCode.id,
        promoterId: promoCode.promoterId,
      })
      .from(promoCodeRedemption)
      .innerJoin(promoCode, eq(promoCodeRedemption.promoCodeId, promoCode.id))
      .where(eq(promoCodeRedemption.orderId, orderId))
      .limit(1);
    return row ?? null;
  }

  async existsByCode(code: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: promoCode.id })
      .from(promoCode)
      .where(eq(promoCode.code, code.toUpperCase()))
      .limit(1);
    return Boolean(row);
  }

  async create(entity: PromoCode): Promise<PromoCode> {
    const [row] = await this.db
      .insert(promoCode)
      .values({
        id: entity.id,
        code: entity.code,
        discountType: entity.discountType,
        discountValue: entity.discountValue.toFixed(2),
        usageQuota: entity.usageQuota,
        scope: entity.scope,
        isActive: entity.isActive,
      })
      .returning();
    if (!row) throw new Error("No se pudo crear el código promocional");
    return this.toDomain(row);
  }

  async createGenerated(
    input: GeneratedRedemptionCodeInput,
    tx?: unknown,
  ): Promise<void> {
    const exec = (tx as Tx | undefined) ?? this.db;
    await exec.insert(promoCode).values({
      id: input.id,
      code: input.code,
      discountType: input.discountType,
      discountValue: input.discountValue.toFixed(2),
      usageQuota: 1,
      scope: "ticket_type",
      eventId: input.eventId,
      ticketTypeId: input.ticketTypeId,
      promoterId: input.promoterId,
      promoterEventId: input.promoterEventId,
      createdBy: input.createdBy,
      isActive: true,
    });
  }

  async incrementClicks(code: string): Promise<void> {
    await this.db
      .update(promoCode)
      .set({ clicks: sql`${promoCode.clicks} + 1` })
      .where(eq(promoCode.code, code.toUpperCase()));
  }

  async deactivateUnredeemedByPromoterEvent(
    promoterEventId: string,
    tx?: unknown,
  ): Promise<void> {
    const exec = (tx as Tx | undefined) ?? this.db;
    await exec
      .update(promoCode)
      .set({ isActive: false })
      .where(
        and(
          eq(promoCode.promoterEventId, promoterEventId),
          eq(promoCode.usedCount, 0),
        ),
      );
  }

  async countByAllocation(
    promoterEventId: string,
    ticketTypeId: string,
  ): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(promoCode)
      .where(
        and(
          eq(promoCode.promoterEventId, promoterEventId),
          eq(promoCode.ticketTypeId, ticketTypeId),
        ),
      );
    return Number(row?.n ?? 0);
  }

  async listByPromoterEvent(
    promoterEventId: string,
  ): Promise<RedemptionCodeView[]> {
    const rows = await this.db
      .select({
        id: promoCode.id,
        code: promoCode.code,
        ticketTypeId: promoCode.ticketTypeId,
        ticketTypeName: ticketType.name,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        usageQuota: promoCode.usageQuota,
        usedCount: promoCode.usedCount,
        clicks: promoCode.clicks,
        isActive: promoCode.isActive,
        validUntil: promoCode.validUntil,
        createdAt: promoCode.createdAt,
      })
      .from(promoCode)
      .leftJoin(ticketType, eq(promoCode.ticketTypeId, ticketType.id))
      .where(eq(promoCode.promoterEventId, promoterEventId))
      .orderBy(desc(promoCode.createdAt));
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      ticketTypeId: r.ticketTypeId,
      ticketTypeName: r.ticketTypeName ?? null,
      discountType: r.discountType as DiscountType,
      discountValue: Number(r.discountValue),
      usageQuota: r.usageQuota,
      usedCount: r.usedCount,
      clicks: r.clicks,
      isActive: r.isActive,
      validUntil: r.validUntil,
      createdAt: r.createdAt,
    }));
  }

  async resolveView(code: string): Promise<ResolvedRedemptionCodeView | null> {
    const [r] = await this.db
      .select({
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        usageQuota: promoCode.usageQuota,
        usedCount: promoCode.usedCount,
        isActive: promoCode.isActive,
        validUntil: promoCode.validUntil,
        promoterName: promoter.name,
        eventId: event.id,
        eventSlug: event.slug,
        eventName: event.name,
        eventStartsAt: event.startsAt,
        eventFlyer: event.flyerUrl,
        ttId: ticketType.id,
        ttName: ticketType.name,
        ttPrice: ticketType.price,
        ttCurrency: ticketType.currency,
      })
      .from(promoCode)
      .leftJoin(promoter, eq(promoCode.promoterId, promoter.id))
      .leftJoin(event, eq(promoCode.eventId, event.id))
      .leftJoin(ticketType, eq(promoCode.ticketTypeId, ticketType.id))
      .where(eq(promoCode.code, code.toUpperCase()))
      .limit(1);
    if (!r) return null;
    return {
      code: r.code,
      discountType: r.discountType as DiscountType,
      discountValue: Number(r.discountValue),
      usageQuota: r.usageQuota,
      usedCount: r.usedCount,
      isActive: r.isActive,
      validUntil: r.validUntil,
      promoterName: r.promoterName ?? null,
      event: r.eventId
        ? {
            id: r.eventId,
            slug: r.eventSlug as string,
            name: r.eventName as string,
            startsAt: r.eventStartsAt as Date,
            flyerUrl: r.eventFlyer ?? null,
          }
        : null,
      ticketType: r.ttId
        ? {
            id: r.ttId,
            name: r.ttName as string,
            price: Number(r.ttPrice),
            currency: r.ttCurrency as string,
          }
        : null,
    };
  }

  /**
   * Incremento ATÓMICO y CONDICIONAL del cupo (M1): sólo suma si aún queda cupo
   * (`usage_quota IS NULL` = ilimitado, o `used_count < usage_quota`). Cierra la
   * sobreventa bajo concurrencia sin depender del CHECK de la BD: dos canjes
   * simultáneos compiten por el mismo UPDATE y el perdedor no toca fila →
   * `PromoCodeQuotaExhaustedError` (409), que revierte la Tx del checkout.
   */
  async incrementUsedCount(id: string, tx?: unknown): Promise<void> {
    const exec = (tx as Tx | undefined) ?? this.db;
    const rows = await exec
      .update(promoCode)
      .set({ usedCount: sql`${promoCode.usedCount} + 1` })
      .where(
        and(
          eq(promoCode.id, id),
          sql`(${promoCode.usageQuota} is null or ${promoCode.usedCount} < ${promoCode.usageQuota})`,
        ),
      )
      .returning({ id: promoCode.id });
    if (rows.length === 0) throw new PromoCodeQuotaExhaustedError();
  }

  async recordRedemption(
    record: PromoRedemptionRecord,
    tx?: unknown,
  ): Promise<void> {
    const exec = (tx as Tx | undefined) ?? this.db;
    try {
      await exec.insert(promoCodeRedemption).values({
        id: record.id,
        promoCodeId: record.promoCodeId,
        orderId: record.orderId,
        userId: record.userId,
        discountApplied: record.discountApplied.toFixed(2),
      });
    } catch (err) {
      // Límite por usuario (M1): el UNIQUE (promo_code_id, user_id) que añade el
      // esquema convierte un segundo canje del mismo usuario en 23505 → 409.
      if (isUniqueViolation(err)) throw new PromoCodeAlreadyRedeemedError();
      throw err;
    }
  }

  /**
   * companyId dueño del código para aislamiento tenant (M5): vía event→local, o
   * localId directo, o el promotor del código. `null` si no se puede acotar a una
   * empresa (fail-closed: el use-case lo trata como acceso denegado a no-super).
   */
  async ownerCompanyId(promoCodeId: string): Promise<string | null> {
    const eventLocal = alias(local, "promo_event_local");
    const [row] = await this.db
      .select({
        viaEvent: eventLocal.companyId,
        viaLocal: local.companyId,
        viaPromoter: promoter.companyId,
      })
      .from(promoCode)
      .leftJoin(event, eq(event.id, promoCode.eventId))
      .leftJoin(eventLocal, eq(eventLocal.id, event.localId))
      .leftJoin(local, eq(local.id, promoCode.localId))
      .leftJoin(promoter, eq(promoter.id, promoCode.promoterId))
      .where(eq(promoCode.id, promoCodeId))
      .limit(1);
    if (!row) return null;
    return row.viaEvent ?? row.viaLocal ?? row.viaPromoter ?? null;
  }

  async listRedemptionsByCode(
    promoCodeId: string,
  ): Promise<PromoRedemptionRecord[]> {
    const rows = await this.db
      .select()
      .from(promoCodeRedemption)
      .where(eq(promoCodeRedemption.promoCodeId, promoCodeId))
      .orderBy(desc(promoCodeRedemption.redeemedAt));
    return rows.map(toRedemptionRecord);
  }

  async listRedemptionsByUser(
    userId: string,
  ): Promise<PromoRedemptionRecord[]> {
    const rows = await this.db
      .select()
      .from(promoCodeRedemption)
      .where(eq(promoCodeRedemption.userId, userId))
      .orderBy(desc(promoCodeRedemption.redeemedAt));
    return rows.map(toRedemptionRecord);
  }

  private toDomain(row: Row): PromoCode {
    return PromoCode.fromPersistence({
      id: row.id,
      code: row.code,
      discountType: row.discountType as DiscountType,
      discountValue: Number(row.discountValue),
      usageQuota: row.usageQuota,
      usedCount: row.usedCount,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      scope: row.scope as PromoScope,
      eventId: row.eventId,
      localId: row.localId,
      ticketTypeId: row.ticketTypeId,
      isActive: row.isActive,
    });
  }
}
