import { randomUUID } from 'node:crypto';
import { Local } from '../../../../modules/companies/domain/entities/local.entity';

/** Builder fluido para el aggregate Local (multi-tenant por companyId). */
export class LocalBuilder {
  private id: string = randomUUID();
  private companyId: string = randomUUID();
  private zoneId: string | null = null;
  private name = 'Aurora Club Barranco';
  private slug = 'aurora-club-barranco';
  private description: string | null = null;
  private address: string | null = 'Av. Grau 123, Barranco';
  private latitude: number | null = -12.1464;
  private longitude: number | null = -77.0206;
  private published = false;
  private suspendReason: string | null = null;
  private verified = false;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCompanyId(companyId: string): this {
    this.companyId = companyId;
    return this;
  }

  withZoneId(zoneId: string | null): this {
    this.zoneId = zoneId;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withSlug(slug: string): this {
    this.slug = slug;
    return this;
  }

  /** Marca el local como publicado (status=active, visible). */
  asActive(): this {
    this.published = true;
    return this;
  }

  suspended(reason = 'Reportado por usuarios'): this {
    this.suspendReason = reason;
    return this;
  }

  asVerified(): this {
    this.verified = true;
    return this;
  }

  build(): Local {
    const local = Local.create({
      id: this.id,
      companyId: this.companyId,
      zoneId: this.zoneId,
      name: this.name,
      slug: this.slug,
      description: this.description,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
    });
    if (this.published) local.publish();
    if (this.suspendReason !== null) local.suspend(this.suspendReason);
    if (this.verified) local.setVerified(true);
    return local;
  }
}
