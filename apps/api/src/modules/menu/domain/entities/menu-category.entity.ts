export interface MenuCategoryProps {
  id: string;
  localId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Categoría ordenable de la carta de un local. */
export class MenuCategory {
  private constructor(private readonly props: MenuCategoryProps) {}

  static create(
    input: Pick<MenuCategoryProps, 'id' | 'localId' | 'name' | 'displayOrder'> &
      Partial<Pick<MenuCategoryProps, 'isActive' | 'createdAt' | 'updatedAt'>>,
  ): MenuCategory {
    const now = input.createdAt ?? new Date();
    return new MenuCategory({
      ...input,
      name: input.name.trim(),
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static fromPersistence(props: MenuCategoryProps): MenuCategory {
    return new MenuCategory(props);
  }

  rename(name: string, now = new Date()): void {
    this.props.name = name.trim();
    this.props.updatedAt = now;
  }

  reorder(displayOrder: number, now = new Date()): void {
    this.props.displayOrder = displayOrder;
    this.props.updatedAt = now;
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
