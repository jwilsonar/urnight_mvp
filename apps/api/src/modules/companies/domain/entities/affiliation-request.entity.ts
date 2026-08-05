export type AffiliationStatus = 'pending' | 'approved' | 'rejected';

export interface AffiliationRequestProps {
  id: string;
  legalName: string;
  ruc: string;
  commercialName: string;
  zoneId: string | null;
  address: string | null;
  socials: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  legalDeclarationAccepted: boolean;
  legalDeclarationAcceptedAt: Date | null;
  status: AffiliationStatus;
  rejectionReason: string | null;
  submittedBy: string | null;
  reviewedBy: string | null;
  companyId: string | null;
  localId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

/** Solicitud de afiliación (AFFILIATION_REQUEST §4.1). Al aprobar crea company+local. */
export class AffiliationRequest {
  private constructor(private readonly props: AffiliationRequestProps) {}

  static submit(input: {
    id: string;
    legalName: string;
    ruc: string;
    commercialName: string;
    zoneId?: string | null;
    address?: string | null;
    socials?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    termsAccepted: true;
    legalDeclarationAccepted: true;
    submittedBy?: string | null;
  }): AffiliationRequest {
    const acceptedAt = new Date();
    return new AffiliationRequest({
      id: input.id,
      legalName: input.legalName.trim(),
      ruc: input.ruc,
      commercialName: input.commercialName.trim(),
      zoneId: input.zoneId ?? null,
      address: input.address ?? null,
      socials: input.socials ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      termsAccepted: input.termsAccepted,
      termsAcceptedAt: acceptedAt,
      legalDeclarationAccepted: input.legalDeclarationAccepted,
      legalDeclarationAcceptedAt: acceptedAt,
      status: 'pending',
      rejectionReason: null,
      submittedBy: input.submittedBy ?? null,
      reviewedBy: null,
      companyId: null,
      localId: null,
      createdAt: acceptedAt,
      reviewedAt: null,
    });
  }

  static fromPersistence(props: AffiliationRequestProps): AffiliationRequest {
    return new AffiliationRequest(props);
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  approve(reviewedBy: string, companyId: string, localId: string): void {
    this.props.status = 'approved';
    this.props.reviewedBy = reviewedBy;
    this.props.companyId = companyId;
    this.props.localId = localId;
    this.props.reviewedAt = new Date();
  }

  reject(reviewedBy: string, reason: string): void {
    this.props.status = 'rejected';
    this.props.reviewedBy = reviewedBy;
    this.props.rejectionReason = reason;
    this.props.reviewedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get legalName(): string {
    return this.props.legalName;
  }
  get ruc(): string {
    return this.props.ruc;
  }
  get commercialName(): string {
    return this.props.commercialName;
  }
  get zoneId(): string | null {
    return this.props.zoneId;
  }
  get contactEmail(): string | null {
    return this.props.contactEmail;
  }
  get contactPhone(): string | null {
    return this.props.contactPhone;
  }
  get termsAccepted(): boolean {
    return this.props.termsAccepted;
  }
  get termsAcceptedAt(): Date | null {
    return this.props.termsAcceptedAt;
  }
  get legalDeclarationAccepted(): boolean {
    return this.props.legalDeclarationAccepted;
  }
  get legalDeclarationAcceptedAt(): Date | null {
    return this.props.legalDeclarationAcceptedAt;
  }
  get status(): AffiliationStatus {
    return this.props.status;
  }
  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }
  get companyId(): string | null {
    return this.props.companyId;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
