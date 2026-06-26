export type EventStatus = 'draft' | 'scheduled' | 'published' | 'cancelled' | 'finished';

/**
 * Limpia las etiquetas libres: recorta, descarta vacías, recorta a 40 chars y
 * deduplica sin distinguir mayúsculas/acentos (conserva la primera grafía).
 */
function normalizeCustomTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const value = raw.trim().slice(0, 40);
    if (!value) continue;
    const key = value
      .toLowerCase()
      .normalize('NFD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result.slice(0, 50);
}

export interface EventProps {
  id: string;
  localId: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  flyerUrl: string | null;
  totalCapacity: number;
  ticketsSold: number;
  checkinsCount: number;
  status: EventStatus;
  minAgeNote: string;
  dressCode: string | null;
  customTags: string[];
  createdBy: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregate Event (§4.1). Aforo + estado de publicación. */
export class Event {
  /** Taxonomías asociadas (categorías/géneros y etiquetas). Cargadas bajo demanda
   * por el repositorio; no forman parte de las columnas de `event`. */
  private genreIdsList: string[] = [];
  private tagIdsList: string[] = [];

  private constructor(private readonly props: EventProps) {}

  static create(input: {
    id: string;
    localId: string;
    name: string;
    slug: string;
    description?: string | null;
    startsAt: Date;
    endsAt?: Date | null;
    flyerUrl?: string | null;
    totalCapacity?: number;
    minAgeNote?: string;
    dressCode?: string | null;
    customTags?: string[];
    createdBy?: string | null;
  }): Event {
    const now = new Date();
    return new Event({
      id: input.id,
      localId: input.localId,
      name: input.name.trim(),
      slug: input.slug,
      description: input.description ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      flyerUrl: input.flyerUrl ?? null,
      totalCapacity: input.totalCapacity ?? 0,
      ticketsSold: 0,
      checkinsCount: 0,
      status: 'draft',
      minAgeNote: input.minAgeNote ?? '+18',
      dressCode: input.dressCode ?? null,
      customTags: normalizeCustomTags(input.customTags ?? []),
      createdBy: input.createdBy ?? null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: EventProps): Event {
    return new Event(props);
  }

  /** ¿Se puede publicar? No si está cancelado/finalizado. */
  canPublish(): boolean {
    return this.props.status !== 'cancelled' && this.props.status !== 'finished';
  }

  publish(): void {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.touch();
  }

  cancel(): void {
    this.props.status = 'cancelled';
    this.touch();
  }

  /**
   * Edita los datos del evento (admin_local dueño). Solo aplica los campos
   * presentes; el slug es inmutable (permalink público). Pasar `null` en un
   * campo anulable lo limpia.
   */
  edit(patch: {
    name?: string;
    description?: string | null;
    startsAt?: Date;
    endsAt?: Date | null;
    totalCapacity?: number;
    minAgeNote?: string;
    dressCode?: string | null;
    customTags?: string[];
  }): void {
    if (patch.name !== undefined) this.props.name = patch.name.trim();
    if (patch.description !== undefined) this.props.description = patch.description;
    if (patch.startsAt !== undefined) this.props.startsAt = patch.startsAt;
    if (patch.endsAt !== undefined) this.props.endsAt = patch.endsAt;
    if (patch.totalCapacity !== undefined) this.props.totalCapacity = patch.totalCapacity;
    if (patch.minAgeNote !== undefined) this.props.minAgeNote = patch.minAgeNote;
    if (patch.dressCode !== undefined) this.props.dressCode = patch.dressCode;
    if (patch.customTags !== undefined) this.props.customTags = normalizeCustomTags(patch.customTags);
    this.touch();
  }

  /** Reemplaza la referencia del flyer (key de S3 ya promovida, o null). */
  setFlyer(flyerUrl: string | null): void {
    this.props.flyerUrl = flyerUrl;
    this.touch();
  }

  /** Asocia las taxonomías (categorías/géneros y etiquetas) leídas del repo. */
  setTaxonomy(genreIds: string[], tagIds: string[]): void {
    this.genreIdsList = [...genreIds];
    this.tagIdsList = [...tagIds];
  }

  isOnSale(): boolean {
    return this.props.status === 'published';
  }

  hasCapacityFor(qty: number): boolean {
    return this.props.totalCapacity === 0 || this.props.ticketsSold + qty <= this.props.totalCapacity;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string {
    return this.props.localId;
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
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get endsAt(): Date | null {
    return this.props.endsAt;
  }
  get flyerUrl(): string | null {
    return this.props.flyerUrl;
  }
  get totalCapacity(): number {
    return this.props.totalCapacity;
  }
  get ticketsSold(): number {
    return this.props.ticketsSold;
  }
  get checkinsCount(): number {
    return this.props.checkinsCount;
  }
  get status(): EventStatus {
    return this.props.status;
  }
  get minAgeNote(): string {
    return this.props.minAgeNote;
  }
  get dressCode(): string | null {
    return this.props.dressCode;
  }
  /** Etiquetas libres del evento (JSON), adicionales al catálogo. */
  get customTags(): string[] {
    return this.props.customTags;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }
  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  /** Ids de categorías/géneros musicales asociados (vacío si no se cargaron). */
  get genreIds(): string[] {
    return this.genreIdsList;
  }
  /** Ids de etiquetas asociadas (vacío si no se cargaron). */
  get tagIds(): string[] {
    return this.tagIdsList;
  }
}
