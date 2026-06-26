import { randomUUID } from 'node:crypto';
import {
  Company,
  type CompanyStatus,
} from '../../../../modules/companies/domain/entities/company.entity';

/** Builder fluido para el aggregate Company (tenant raíz). */
export class CompanyBuilder {
  private id: string = randomUUID();
  private legalName = 'Discoteca Aurora S.A.C.';
  private ruc = '20512345678';
  private commercialName = 'Aurora Club';
  private contactEmail: string | null = 'contacto@aurora.pe';
  private contactPhone: string | null = '+51999888777';
  private status: CompanyStatus | null = null;

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

  withContactEmail(contactEmail: string | null): this {
    this.contactEmail = contactEmail;
    return this;
  }

  withContactPhone(contactPhone: string | null): this {
    this.contactPhone = contactPhone;
    return this;
  }

  suspended(): this {
    this.status = 'suspended';
    return this;
  }

  build(): Company {
    const company = Company.create({
      id: this.id,
      legalName: this.legalName,
      ruc: this.ruc,
      commercialName: this.commercialName,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
    });
    if (this.status === 'suspended') company.suspend();
    return company;
  }
}
