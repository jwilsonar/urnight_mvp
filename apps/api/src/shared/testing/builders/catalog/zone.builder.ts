import { randomUUID } from 'node:crypto';
import { Zone } from '../../../../modules/catalog/domain/entities/zone.entity';

/** Builder fluido para el aggregate Zone (delegando en `Zone.fromPersistence`). */
export class ZoneBuilder {
  private id: string = randomUUID();
  private name = 'Centro';
  private slug = 'centro';
  private displayOrder = 0;
  private isActive = true;
  private createdAt = new Date('2026-01-01T00:00:00Z');
  private updatedAt = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
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

  withDisplayOrder(displayOrder: number): this {
    this.displayOrder = displayOrder;
    return this;
  }

  withIsActive(isActive: boolean): this {
    this.isActive = isActive;
    return this;
  }

  asInactive(): this {
    this.isActive = false;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.updatedAt = updatedAt;
    return this;
  }

  build(): Zone {
    return Zone.fromPersistence({
      id: this.id,
      name: this.name,
      slug: this.slug,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
