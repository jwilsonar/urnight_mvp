import { randomUUID } from 'node:crypto';
import { LegalAcceptance } from '../../../modules/identity/domain/entities/legal-acceptance.entity';

/** Builder fluido para LegalAcceptance (record). */
export class LegalAcceptanceBuilder {
  private id: string = randomUUID();
  private userId: string = randomUUID();
  private legalDocumentId: string = randomUUID();
  private versionAccepted = '1.0';
  private ipAddress: string | null = null;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withLegalDocumentId(legalDocumentId: string): this {
    this.legalDocumentId = legalDocumentId;
    return this;
  }

  withVersionAccepted(versionAccepted: string): this {
    this.versionAccepted = versionAccepted;
    return this;
  }

  withIpAddress(ipAddress: string | null): this {
    this.ipAddress = ipAddress;
    return this;
  }

  build(): LegalAcceptance {
    return LegalAcceptance.record({
      id: this.id,
      userId: this.userId,
      legalDocumentId: this.legalDocumentId,
      versionAccepted: this.versionAccepted,
      ipAddress: this.ipAddress,
    });
  }
}
