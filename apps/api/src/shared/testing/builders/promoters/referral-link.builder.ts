import { randomUUID } from 'node:crypto';
import { ReferralLink } from '../../../../modules/promoters/domain/entities/referral-link.entity';

/** Builder fluido para ReferralLink (1:1 con un promotor). */
export class ReferralLinkBuilder {
  private id: string = randomUUID();
  private promoterId = 'promoter-1';
  private code = 'ABCD1234';
  private url = 'https://urnight.pe/r/ABCD1234';
  private clicks = 0;
  private isActive = true;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withPromoterId(promoterId: string): this {
    this.promoterId = promoterId;
    return this;
  }

  withCode(code: string): this {
    this.code = code;
    this.url = `https://urnight.pe/r/${code}`;
    return this;
  }

  withUrl(url: string): this {
    this.url = url;
    return this;
  }

  withClicks(clicks: number): this {
    this.clicks = clicks;
    return this;
  }

  asInactive(): this {
    this.isActive = false;
    return this;
  }

  build(): ReferralLink {
    return ReferralLink.fromPersistence({
      id: this.id,
      promoterId: this.promoterId,
      code: this.code,
      url: this.url,
      clicks: this.clicks,
      isActive: this.isActive,
    });
  }
}
