import { Inject, Injectable } from '@nestjs/common';
import {
  deriveLocalVerification,
  type DerivedLocalVerification,
} from '../../domain/entities/local-verification-document.entity';
import {
  LOCAL_VERIFICATION_DOCUMENT_REPOSITORY,
  type LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';
import {
  VERIFICATION_POLICY_PORT,
  type VerificationPolicyPort,
} from '../../domain/ports/verification-policy.port';

export interface LocalVerificationStatusResult extends DerivedLocalVerification {
  reviewedAt: Date | null;
}

@Injectable()
export class GetLocalVerificationStatusUseCase {
  constructor(
    @Inject(LOCAL_VERIFICATION_DOCUMENT_REPOSITORY)
    private readonly documents: LocalVerificationDocumentRepository,
    @Inject(VERIFICATION_POLICY_PORT)
    private readonly policy: VerificationPolicyPort,
  ) {}

  async execute(
    localId: string,
    now = new Date(),
  ): Promise<LocalVerificationStatusResult | null> {
    const contexts = await this.documents.listByLocalId(localId);
    if (contexts.length === 0) return null;
    const policy = await this.policy.getPolicy();
    const documentEntities = contexts.map((context) => context.document);
    const derived = deriveLocalVerification(
      documentEntities,
      policy.requiredDocumentTypes,
      now,
      policy.expiryWarningDays,
    );
    const reviewedAt =
      documentEntities
        .map((document) => document.reviewedAt)
        .filter((value): value is Date => value !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return { ...derived, reviewedAt };
  }
}
