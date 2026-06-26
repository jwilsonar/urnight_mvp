import { randomUUID } from 'node:crypto';
import {
  PromoCode,
  type DiscountType,
  type PromoScope,
} from '../../../../modules/promoters/domain/entities/promo-code.entity';

/** Builder fluido para el aggregate PromoCode. Usa `fromPersistence` para fijar usos/vigencia. */
export class PromoCodeBuilder {
  private id: string = randomUUID();
  private code = 'WELCOME10';
  private discountType: DiscountType = 'percentage';
  private discountValue = 10;
  private usageQuota: number | null = null;
  private usedCount = 0;
  private validFrom: Date | null = null;
  private validUntil: Date | null = null;
  private scope: PromoScope = 'global';
  private eventId: string | null = null;
  private localId: string | null = null;
  private isActive = true;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCode(code: string): this {
    this.code = code;
    return this;
  }

  withDiscount(discountType: DiscountType, discountValue: number): this {
    this.discountType = discountType;
    this.discountValue = discountValue;
    return this;
  }

  asPercentage(value: number): this {
    this.discountType = 'percentage';
    this.discountValue = value;
    return this;
  }

  asFixedAmount(value: number): this {
    this.discountType = 'fixed_amount';
    this.discountValue = value;
    return this;
  }

  withUsageQuota(usageQuota: number | null): this {
    this.usageQuota = usageQuota;
    return this;
  }

  withUsedCount(usedCount: number): this {
    this.usedCount = usedCount;
    return this;
  }

  withValidity(validFrom: Date | null, validUntil: Date | null): this {
    this.validFrom = validFrom;
    this.validUntil = validUntil;
    return this;
  }

  withScope(scope: PromoScope): this {
    this.scope = scope;
    return this;
  }

  forEvent(eventId: string): this {
    this.scope = 'event';
    this.eventId = eventId;
    return this;
  }

  forLocal(localId: string): this {
    this.scope = 'local';
    this.localId = localId;
    return this;
  }

  asInactive(): this {
    this.isActive = false;
    return this;
  }

  build(): PromoCode {
    return PromoCode.fromPersistence({
      id: this.id,
      code: this.code,
      discountType: this.discountType,
      discountValue: this.discountValue,
      usageQuota: this.usageQuota,
      usedCount: this.usedCount,
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      scope: this.scope,
      eventId: this.eventId,
      localId: this.localId,
      ticketTypeId: null,
      isActive: this.isActive,
    });
  }
}
