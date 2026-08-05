export type VerificationStatus = 'pending' | 'approved' | 'observed' | 'expired';

export interface LocalVerificationProps {
  id: string;
  localId: string;
  status: VerificationStatus;
  licenseReference: string | null;
  documentUrl: string | null;
  notes: string | null;
  verifiedBy: string | null;
  reviewedAt: Date | null;
  validUntil: string | null;
  createdAt: Date;
}

/** Verificación de local (ITSE/licencia §4.1). Deriva local.isVerified. */
export class LocalVerification {
  private constructor(private readonly props: LocalVerificationProps) {}

  static request(input: {
    id: string;
    localId: string;
    licenseReference?: string | null;
    documentUrl?: string | null;
    notes?: string | null;
    validUntil?: string | null;
  }): LocalVerification {
    return new LocalVerification({
      id: input.id,
      localId: input.localId,
      status: 'pending',
      licenseReference: input.licenseReference ?? null,
      documentUrl: input.documentUrl ?? null,
      notes: input.notes ?? null,
      verifiedBy: null,
      reviewedAt: null,
      validUntil: input.validUntil ?? null,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: LocalVerificationProps): LocalVerification {
    return new LocalVerification(props);
  }

  review(decision: 'approved' | 'observed' | 'expired', verifiedBy: string, notes?: string): void {
    this.props.status = decision;
    this.props.verifiedBy = verifiedBy;
    this.props.reviewedAt = new Date();
    if (notes !== undefined) this.props.notes = notes;
  }

  /** ¿Esta verificación marca al local como verificado? */
  grantsVerification(): boolean {
    return this.props.status === 'approved';
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string {
    return this.props.localId;
  }
  get status(): VerificationStatus {
    return this.props.status;
  }
  get licenseReference(): string | null {
    return this.props.licenseReference;
  }
  get documentUrl(): string | null {
    return this.props.documentUrl;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get verifiedBy(): string | null {
    return this.props.verifiedBy;
  }
  get validUntil(): string | null {
    return this.props.validUntil;
  }
  get reviewedAt(): Date | null {
    return this.props.reviewedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
