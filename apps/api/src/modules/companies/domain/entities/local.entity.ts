export type LocalStatus = 'draft' | 'active' | 'inactive' | 'suspended';

export interface LocalProps {
  id: string;
  companyId: string;
  zoneId: string | null;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  socials: string | null;
  /** Referencia de la portada: key de S3 (o URL absoluta para externas). */
  mainImageKey: string | null;
  status: LocalStatus;
  suspensionReason: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregate Local (multi-tenant por companyId §4.1). */
export class Local {
  private constructor(private readonly props: LocalProps) {}

  static create(input: {
    id: string;
    companyId: string;
    zoneId?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    googleMapsUrl?: string | null;
    socials?: string | null;
    mainImageKey?: string | null;
  }): Local {
    const now = new Date();
    return new Local({
      id: input.id,
      companyId: input.companyId,
      zoneId: input.zoneId ?? null,
      name: input.name.trim(),
      slug: input.slug,
      description: input.description ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      googleMapsUrl: input.googleMapsUrl ?? null,
      socials: input.socials ?? null,
      mainImageKey: input.mainImageKey ?? null,
      status: 'draft',
      suspensionReason: null,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: LocalProps): Local {
    return new Local(props);
  }

  publish(): void {
    this.props.status = 'active';
    this.props.suspensionReason = null;
    this.touch();
  }

  suspend(reason: string): void {
    this.props.status = 'suspended';
    this.props.suspensionReason = reason;
    this.touch();
  }

  setVerified(verified: boolean): void {
    this.props.isVerified = verified;
    this.touch();
  }

  isVisible(): boolean {
    return this.props.status === 'active';
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get zoneId(): string | null {
    return this.props.zoneId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | null {
    return this.props.description;
  }
  get address(): string | null {
    return this.props.address;
  }
  get latitude(): number | null {
    return this.props.latitude;
  }
  get longitude(): number | null {
    return this.props.longitude;
  }
  get mainImageKey(): string | null {
    return this.props.mainImageKey;
  }
  get status(): LocalStatus {
    return this.props.status;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
