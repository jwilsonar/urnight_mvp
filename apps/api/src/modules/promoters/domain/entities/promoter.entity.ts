export type PromoterStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface PromoterProps {
  id: string;
  companyId: string;
  localId: string | null;
  userId: string | null;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Correo de la persona invitada; clave de match hasta que confirme. */
  invitedEmail: string | null;
  status: PromoterStatus;
  createdAt: Date;
}

/** Aggregate Promoter (§4.1). */
export class Promoter {
  private constructor(private readonly props: PromoterProps) {}

  static create(input: {
    id: string;
    companyId: string;
    localId?: string | null;
    userId?: string | null;
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }): Promoter {
    return new Promoter({
      id: input.id,
      companyId: input.companyId,
      localId: input.localId ?? null,
      userId: input.userId ?? null,
      name: input.name.trim(),
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      invitedEmail: null,
      status: 'active',
      createdAt: new Date(),
    });
  }

  /**
   * Invita a una persona (por correo) a ser promotor de una empresa. Queda en
   * `pending` y sin link de referido hasta que esa persona confirme la asociación
   * desde su panel (regla de negocio: consentimiento del promotor).
   */
  static invite(input: {
    id: string;
    companyId: string;
    localId?: string | null;
    name: string;
    invitedEmail: string;
    contactPhone?: string | null;
  }): Promoter {
    const email = input.invitedEmail.trim().toLowerCase();
    return new Promoter({
      id: input.id,
      companyId: input.companyId,
      localId: input.localId ?? null,
      userId: null,
      name: input.name.trim(),
      contactEmail: email,
      contactPhone: input.contactPhone ?? null,
      invitedEmail: email,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: PromoterProps): Promoter {
    return new Promoter(props);
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  /** ¿El actor (por id de usuario o correo) es la persona invitada? */
  belongsToInvited(userId: string, email?: string | null): boolean {
    if (this.props.userId && this.props.userId === userId) return true;
    if (this.props.invitedEmail && email) {
      return this.props.invitedEmail === email.trim().toLowerCase();
    }
    return false;
  }

  /** La persona acepta: se liga su userId y el promotor pasa a activo. */
  confirm(userId: string): void {
    this.props.userId = userId;
    this.props.status = 'active';
  }

  /** La persona rechaza la invitación: el promotor queda inactivo. */
  reject(): void {
    this.props.status = 'inactive';
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get name(): string {
    return this.props.name;
  }
  get contactEmail(): string | null {
    return this.props.contactEmail;
  }
  get contactPhone(): string | null {
    return this.props.contactPhone;
  }
  get invitedEmail(): string | null {
    return this.props.invitedEmail;
  }
  get status(): PromoterStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
