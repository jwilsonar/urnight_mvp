import type {
  LocalDocumentLifecycleStatus,
  LocalDocumentReviewStatus,
  LocalDocumentType,
} from '@urnight/contracts';

export interface LocalVerificationDocumentProps {
  id: string;
  verificationId: string;
  documentType: LocalDocumentType;
  storageKey: string;
  issuedAt: string;
  expiresAt: string;
  reviewStatus: LocalDocumentReviewStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  expiryWarningSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LocalVerificationDocument {
  private constructor(private readonly props: LocalVerificationDocumentProps) {}

  static create(
    input: Omit<
      LocalVerificationDocumentProps,
      | 'reviewStatus'
      | 'reviewedBy'
      | 'reviewedAt'
      | 'reviewNotes'
      | 'expiryWarningSentAt'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): LocalVerificationDocument {
    const now = new Date();
    return new LocalVerificationDocument({
      ...input,
      reviewStatus: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      expiryWarningSentAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(
    props: LocalVerificationDocumentProps,
  ): LocalVerificationDocument {
    return new LocalVerificationDocument(props);
  }

  review(
    decision: 'approved' | 'rejected',
    reviewerId: string,
    notes?: string,
  ): void {
    this.props.reviewStatus = decision;
    this.props.reviewedBy = reviewerId;
    this.props.reviewedAt = new Date();
    this.props.reviewNotes = notes?.trim() || null;
    this.props.updatedAt = new Date();
  }

  lifecycleStatus(
    now = new Date(),
    expiryWarningDays = 30,
  ): LocalDocumentLifecycleStatus {
    if (this.reviewStatus === 'pending') return 'pending';
    if (this.reviewStatus === 'rejected') return 'rejected';
    const expiresAt = startOfUtcDay(this.expiresAt);
    const today = startOfUtcDay(now);
    if (expiresAt < today) return 'expired';
    const warningAt = new Date(today);
    warningAt.setUTCDate(warningAt.getUTCDate() + expiryWarningDays);
    return expiresAt <= warningAt ? 'expiring_soon' : 'valid';
  }

  get id(): string {
    return this.props.id;
  }
  get verificationId(): string {
    return this.props.verificationId;
  }
  get documentType(): LocalDocumentType {
    return this.props.documentType;
  }
  get storageKey(): string {
    return this.props.storageKey;
  }
  get issuedAt(): string {
    return this.props.issuedAt;
  }
  get expiresAt(): string {
    return this.props.expiresAt;
  }
  get reviewStatus(): LocalDocumentReviewStatus {
    return this.props.reviewStatus;
  }
  get reviewedBy(): string | null {
    return this.props.reviewedBy;
  }
  get reviewedAt(): Date | null {
    return this.props.reviewedAt;
  }
  get reviewNotes(): string | null {
    return this.props.reviewNotes;
  }
  get expiryWarningSentAt(): Date | null {
    return this.props.expiryWarningSentAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function startOfUtcDay(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00.000Z`) : value;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export interface DerivedLocalVerification {
  verified: boolean;
  expiringSoon: boolean;
  blocker:
    | 'missing_required_document'
    | 'pending_review'
    | 'rejected'
    | 'expired'
    | null;
}

export function deriveLocalVerification(
  documents: readonly LocalVerificationDocument[],
  requiredTypes: readonly LocalDocumentType[],
  now = new Date(),
  expiryWarningDays = 30,
): DerivedLocalVerification {
  let expiringSoon = false;
  for (const requiredType of requiredTypes) {
    const versions = documents
      .filter((document) => document.documentType === requiredType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (versions.length === 0) {
      return { verified: false, expiringSoon: false, blocker: 'missing_required_document' };
    }
    const approvedCurrent = versions.find((document) => {
      const state = document.lifecycleStatus(now, expiryWarningDays);
      return state === 'valid' || state === 'expiring_soon';
    });
    if (approvedCurrent) {
      expiringSoon ||= approvedCurrent.lifecycleStatus(now, expiryWarningDays) === 'expiring_soon';
      continue;
    }
    const latestState = versions[0]!.lifecycleStatus(now, expiryWarningDays);
    const blocker =
      latestState === 'pending'
        ? 'pending_review'
        : latestState === 'rejected'
          ? 'rejected'
          : 'expired';
    return { verified: false, expiringSoon: false, blocker };
  }
  return { verified: true, expiringSoon, blocker: null };
}
