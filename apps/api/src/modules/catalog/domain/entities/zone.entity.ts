/**
 * Aggregate Zone (dominio Taxonomy — §4.1). Núcleo puro: SIN dependencias de
 * NestJS, Drizzle ni otros módulos (Dependency Rule §2.2).
 */
export interface ZoneProps {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Zone {
  private constructor(private readonly props: ZoneProps) {}

  /** Reconstituye desde persistencia validando invariantes mínimas. */
  static fromPersistence(props: ZoneProps): Zone {
    if (props.name.trim().length < 2) {
      throw new Error('Zone.name inválido');
    }
    return new Zone(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get displayOrder(): number {
    return this.props.displayOrder;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
