import { randomUUID } from 'node:crypto';
import {
  PromoterApplication,
  type PromoterApplicationStatus,
} from '../../../../modules/promoters/domain/entities/promoter-application.entity';

/** Builder fluido para PromoterApplication. Usa `fromPersistence` para fijar estado. */
export class PromoterApplicationBuilder {
  private id: string = randomUUID();
  private localId: string | null = 'local-1';
  private eventId: string | null = null;
  private applicantUserId: string | null = 'user-1';
  private name = 'Aspirante Demo';
  private contactEmail: string | null = 'aspirante@example.com';
  private contactPhone: string | null = null;
  private socials: string | null = null;
  private status: PromoterApplicationStatus = 'pending';
  private reviewedBy: string | null = null;
  private createdPromoterId: string | null = null;
  private createdAt: Date = new Date('2026-01-01T00:00:00Z');
  private reviewedAt: Date | null = null;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withLocalId(localId: string | null): this {
    this.localId = localId;
    return this;
  }

  withApplicantUserId(applicantUserId: string | null): this {
    this.applicantUserId = applicantUserId;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withContactEmail(contactEmail: string | null): this {
    this.contactEmail = contactEmail;
    return this;
  }

  withContactPhone(contactPhone: string | null): this {
    this.contactPhone = contactPhone;
    return this;
  }

  asApproved(reviewedBy = 'reviewer-1', createdPromoterId = 'promoter-1'): this {
    this.status = 'approved';
    this.reviewedBy = reviewedBy;
    this.createdPromoterId = createdPromoterId;
    this.reviewedAt = new Date('2026-01-02T00:00:00Z');
    return this;
  }

  asRejected(reviewedBy = 'reviewer-1'): this {
    this.status = 'rejected';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date('2026-01-02T00:00:00Z');
    return this;
  }

  build(): PromoterApplication {
    return PromoterApplication.fromPersistence({
      id: this.id,
      localId: this.localId,
      eventId: this.eventId,
      applicantUserId: this.applicantUserId,
      name: this.name,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      socials: this.socials,
      status: this.status,
      reviewedBy: this.reviewedBy,
      createdPromoterId: this.createdPromoterId,
      createdAt: this.createdAt,
      reviewedAt: this.reviewedAt,
    });
  }
}
