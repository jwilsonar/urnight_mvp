import { randomUUID } from 'node:crypto';
import { LocalVerification } from '../../../../modules/companies/domain/entities/local-verification.entity';

/** Builder fluido para LocalVerification (ITSE / licencia). */
export class LocalVerificationBuilder {
  private id: string = randomUUID();
  private localId: string = randomUUID();
  private licenseReference: string | null = 'ITSE-2026-001';
  private documentUrl: string | null = 'https://cdn.urnight.pe/itse-001.pdf';
  private notes: string | null = null;
  private validUntil: string | null = '2027-01-01';
  private decision: 'approved' | 'observed' | 'expired' | null = null;
  private verifiedBy = 'super-admin';
  private reviewNotes: string | undefined = undefined;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withLocalId(localId: string): this {
    this.localId = localId;
    return this;
  }

  withLicenseReference(licenseReference: string | null): this {
    this.licenseReference = licenseReference;
    return this;
  }

  withValidUntil(validUntil: string | null): this {
    this.validUntil = validUntil;
    return this;
  }

  reviewed(
    decision: 'approved' | 'observed' | 'expired',
    verifiedBy = 'super-admin',
    notes?: string,
  ): this {
    this.decision = decision;
    this.verifiedBy = verifiedBy;
    this.reviewNotes = notes;
    return this;
  }

  build(): LocalVerification {
    const verification = LocalVerification.request({
      id: this.id,
      localId: this.localId,
      licenseReference: this.licenseReference,
      documentUrl: this.documentUrl,
      notes: this.notes,
      validUntil: this.validUntil,
    });
    if (this.decision !== null) {
      verification.review(this.decision, this.verifiedBy, this.reviewNotes);
    }
    return verification;
  }
}
