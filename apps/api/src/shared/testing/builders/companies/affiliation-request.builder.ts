import { randomUUID } from 'node:crypto';
import { AffiliationRequest } from '../../../../modules/companies/domain/entities/affiliation-request.entity';

/** Builder fluido para AffiliationRequest (solicitud de afiliación). */
export class AffiliationRequestBuilder {
  private id: string = randomUUID();
  private legalName = 'Discoteca Aurora S.A.C.';
  private ruc = '20512345678';
  private commercialName = 'Aurora Club';
  private zoneId: string | null = null;
  private address: string | null = 'Av. Grau 123, Barranco';
  private socials: string | null = null;
  private contactName: string | null = 'Ada Lovelace';
  private contactEmail: string | null = 'contacto@aurora.pe';
  private contactPhone: string | null = '+51999888777';
  private submittedBy: string | null = null;
  private decision: 'approved' | 'rejected' | null = null;
  private reviewedBy = 'super-admin';
  private rejectionReason = 'Documentación incompleta';
  private companyId: string = randomUUID();
  private localId: string = randomUUID();

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withLegalName(legalName: string): this {
    this.legalName = legalName;
    return this;
  }

  withRuc(ruc: string): this {
    this.ruc = ruc;
    return this;
  }

  withCommercialName(commercialName: string): this {
    this.commercialName = commercialName;
    return this;
  }

  withZoneId(zoneId: string | null): this {
    this.zoneId = zoneId;
    return this;
  }

  withContactEmail(contactEmail: string | null): this {
    this.contactEmail = contactEmail;
    return this;
  }

  withSubmittedBy(submittedBy: string | null): this {
    this.submittedBy = submittedBy;
    return this;
  }

  approved(reviewedBy = 'super-admin', companyId?: string, localId?: string): this {
    this.decision = 'approved';
    this.reviewedBy = reviewedBy;
    if (companyId !== undefined) this.companyId = companyId;
    if (localId !== undefined) this.localId = localId;
    return this;
  }

  rejected(reviewedBy = 'super-admin', reason = 'Documentación incompleta'): this {
    this.decision = 'rejected';
    this.reviewedBy = reviewedBy;
    this.rejectionReason = reason;
    return this;
  }

  build(): AffiliationRequest {
    const request = AffiliationRequest.submit({
      id: this.id,
      legalName: this.legalName,
      ruc: this.ruc,
      commercialName: this.commercialName,
      zoneId: this.zoneId,
      address: this.address,
      socials: this.socials,
      contactName: this.contactName,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      submittedBy: this.submittedBy,
    });
    if (this.decision === 'approved') {
      request.approve(this.reviewedBy, this.companyId, this.localId);
    } else if (this.decision === 'rejected') {
      request.reject(this.reviewedBy, this.rejectionReason);
    }
    return request;
  }
}
