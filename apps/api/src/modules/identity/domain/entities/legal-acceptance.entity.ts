export interface LegalAcceptanceProps {
  id: string;
  userId: string;
  legalDocumentId: string;
  versionAccepted: string;
  ipAddress: string | null;
  acceptedAt: Date;
}

/** Constancia de aceptación legal (§4.1). versionAccepted denormalizado p/ auditoría. */
export class LegalAcceptance {
  private constructor(private readonly props: LegalAcceptanceProps) {}

  static record(input: {
    id: string;
    userId: string;
    legalDocumentId: string;
    versionAccepted: string;
    ipAddress?: string | null;
  }): LegalAcceptance {
    return new LegalAcceptance({
      id: input.id,
      userId: input.userId,
      legalDocumentId: input.legalDocumentId,
      versionAccepted: input.versionAccepted,
      ipAddress: input.ipAddress ?? null,
      acceptedAt: new Date(),
    });
  }

  static fromPersistence(props: LegalAcceptanceProps): LegalAcceptance {
    return new LegalAcceptance(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get legalDocumentId(): string {
    return this.props.legalDocumentId;
  }
  get versionAccepted(): string {
    return this.props.versionAccepted;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get acceptedAt(): Date {
    return this.props.acceptedAt;
  }
}
