export type CompanyStatus = 'draft' | 'active' | 'suspended';

export interface CompanyProps {
  id: string;
  legalName: string;
  ruc: string;
  commercialName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregate Company (tenant raíz §4.1). RUC + razón social únicos (DB). */
export class Company {
  private constructor(private readonly props: CompanyProps) {}

  static create(input: {
    id: string;
    legalName: string;
    ruc: string;
    commercialName: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }): Company {
    const now = new Date();
    return new Company({
      id: input.id,
      legalName: input.legalName.trim(),
      ruc: input.ruc,
      commercialName: input.commercialName.trim(),
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: CompanyProps): Company {
    return new Company(props);
  }

  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
  }

  /** Actualización de perfil (self). RUC y razón social son inmutables. */
  updateProfile(patch: {
    commercialName?: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }): void {
    if (patch.commercialName !== undefined) this.props.commercialName = patch.commercialName.trim();
    if (patch.contactEmail !== undefined) this.props.contactEmail = patch.contactEmail;
    if (patch.contactPhone !== undefined) this.props.contactPhone = patch.contactPhone;
    this.props.updatedAt = new Date();
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
  get contactEmail(): string | null {
    return this.props.contactEmail;
  }
  get contactPhone(): string | null {
    return this.props.contactPhone;
  }
  get status(): CompanyStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
