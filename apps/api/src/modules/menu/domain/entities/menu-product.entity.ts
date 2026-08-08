import type { MenuPrice } from '../value-objects/menu-price.value-object';

export interface MenuProductProps {
  id: string;
  categoryId: string;
  localId: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  isAvailable: boolean;
  tags: string[];
  currentPrice: MenuPrice;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuProductChanges {
  categoryId?: string;
  name?: string;
  description?: string | null;
  imageKey?: string | null;
  tags?: string[];
}

/** Producto de carta enriquecido con el único precio vigente. */
export class MenuProduct {
  private constructor(private readonly props: MenuProductProps) {}

  static create(
    input: Pick<
      MenuProductProps,
      'id' | 'categoryId' | 'localId' | 'name' | 'currentPrice'
    > &
      Partial<
        Pick<
          MenuProductProps,
          | 'description'
          | 'imageKey'
          | 'isAvailable'
          | 'tags'
          | 'createdAt'
          | 'updatedAt'
        >
      >,
  ): MenuProduct {
    const now = input.createdAt ?? new Date();
    return new MenuProduct({
      ...input,
      name: input.name.trim(),
      description: input.description ?? null,
      imageKey: input.imageKey ?? null,
      isAvailable: input.isAvailable ?? true,
      tags: [...(input.tags ?? [])],
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static fromPersistence(props: MenuProductProps): MenuProduct {
    return new MenuProduct({ ...props, tags: [...props.tags] });
  }

  update(changes: MenuProductChanges, now = new Date()): void {
    if (changes.categoryId !== undefined) this.props.categoryId = changes.categoryId;
    if (changes.name !== undefined) this.props.name = changes.name.trim();
    if (changes.description !== undefined) this.props.description = changes.description;
    if (changes.imageKey !== undefined) this.props.imageKey = changes.imageKey;
    if (changes.tags !== undefined) this.props.tags = [...changes.tags];
    this.props.updatedAt = now;
  }

  setAvailability(isAvailable: boolean, now = new Date()): void {
    this.props.isAvailable = isAvailable;
    this.props.updatedAt = now;
  }

  setCurrentPrice(price: MenuPrice): void {
    this.props.currentPrice = price;
  }

  get id(): string {
    return this.props.id;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get localId(): string {
    return this.props.localId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get imageKey(): string | null {
    return this.props.imageKey;
  }
  get isAvailable(): boolean {
    return this.props.isAvailable;
  }
  get tags(): string[] {
    return [...this.props.tags];
  }
  get currentPrice(): MenuPrice {
    return this.props.currentPrice;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
