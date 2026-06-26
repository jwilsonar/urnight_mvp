import { randomUUID } from 'node:crypto';
import {
  Promoter,
  type PromoterStatus,
} from '../../../../modules/promoters/domain/entities/promoter.entity';

/** Builder fluido para el aggregate Promoter. Usa `fromPersistence` para fijar status. */
export class PromoterBuilder {
  private id: string = randomUUID();
  private companyId = 'company-1';
  private localId: string | null = 'local-1';
  private userId: string | null = null;
  private name = 'Promotor Demo';
  private contactEmail: string | null = 'promo@example.com';
  private contactPhone: string | null = null;
  private invitedEmail: string | null = null;
  private status: PromoterStatus = 'active';
  private createdAt: Date = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCompanyId(companyId: string): this {
    this.companyId = companyId;
    return this;
  }

  withLocalId(localId: string | null): this {
    this.localId = localId;
    return this;
  }

  withUserId(userId: string | null): this {
    this.userId = userId;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withStatus(status: PromoterStatus): this {
    this.status = status;
    return this;
  }

  asInactive(): this {
    this.status = 'inactive';
    return this;
  }

  asSuspended(): this {
    this.status = 'suspended';
    return this;
  }

  asPending(invitedEmail = 'invitado@example.com'): this {
    this.status = 'pending';
    this.invitedEmail = invitedEmail;
    this.userId = null;
    return this;
  }

  withInvitedEmail(invitedEmail: string | null): this {
    this.invitedEmail = invitedEmail;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): Promoter {
    return Promoter.fromPersistence({
      id: this.id,
      companyId: this.companyId,
      localId: this.localId,
      userId: this.userId,
      name: this.name,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      invitedEmail: this.invitedEmail,
      status: this.status,
      createdAt: this.createdAt,
    });
  }
}
