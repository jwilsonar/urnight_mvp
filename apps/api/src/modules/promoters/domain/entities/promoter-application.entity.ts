export type PromoterApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface PromoterApplicationProps {
  id: string;
  localId: string | null;
  eventId: string | null;
  applicantUserId: string | null;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  socials: string | null;
  status: PromoterApplicationStatus;
  reviewedBy: string | null;
  createdPromoterId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

/** Postulación a promotor (§4.1). Al aprobar crea un Promoter. */
export class PromoterApplication {
  private constructor(private readonly props: PromoterApplicationProps) {}

  static submit(input: {
    id: string;
    localId?: string | null;
    eventId?: string | null;
    applicantUserId?: string | null;
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    socials?: string | null;
  }): PromoterApplication {
    return new PromoterApplication({
      id: input.id,
      localId: input.localId ?? null,
      eventId: input.eventId ?? null,
      applicantUserId: input.applicantUserId ?? null,
      name: input.name.trim(),
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      socials: input.socials ?? null,
      status: 'pending',
      reviewedBy: null,
      createdPromoterId: null,
      createdAt: new Date(),
      reviewedAt: null,
    });
  }

  static fromPersistence(props: PromoterApplicationProps): PromoterApplication {
    return new PromoterApplication(props);
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  approve(reviewedBy: string, promoterId: string): void {
    this.props.status = 'approved';
    this.props.reviewedBy = reviewedBy;
    this.props.createdPromoterId = promoterId;
    this.props.reviewedAt = new Date();
  }

  reject(reviewedBy: string): void {
    this.props.status = 'rejected';
    this.props.reviewedBy = reviewedBy;
    this.props.reviewedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get name(): string {
    return this.props.name;
  }
  get contactEmail(): string | null {
    return this.props.contactEmail;
  }
  get contactPhone(): string | null {
    return this.props.contactPhone;
  }
  get applicantUserId(): string | null {
    return this.props.applicantUserId;
  }
  get status(): PromoterApplicationStatus {
    return this.props.status;
  }
  get createdPromoterId(): string | null {
    return this.props.createdPromoterId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
