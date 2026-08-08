import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { local, menuCategory } from '@urnight/db';
import {
  DRIZZLE,
  type DrizzleDb,
} from '../../../../shared/database/drizzle.constants';
import { MenuCategory } from '../../domain/entities/menu-category.entity';
import type { MenuCategoryRepository } from '../../domain/ports/menu-category.repository';

type Row = typeof menuCategory.$inferSelect;

@Injectable()
export class DrizzleMenuCategoryRepository implements MenuCategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async listByLocal(localId: string, companyId: string | null): Promise<MenuCategory[]> {
    const rows = await this.db
      .select({ category: menuCategory })
      .from(menuCategory)
      .innerJoin(local, eq(local.id, menuCategory.localId))
      .where(
        companyId
          ? and(eq(menuCategory.localId, localId), eq(local.companyId, companyId))
          : eq(menuCategory.localId, localId),
      )
      .orderBy(asc(menuCategory.displayOrder), asc(menuCategory.id));
    return rows.map((row) => this.toDomain(row.category));
  }

  async findById(id: string): Promise<MenuCategory | null> {
    const [row] = await this.db
      .select()
      .from(menuCategory)
      .where(eq(menuCategory.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(category: MenuCategory): Promise<MenuCategory> {
    const [row] = await this.db
      .insert(menuCategory)
      .values({
        id: category.id,
        localId: category.localId,
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la categoría de carta.');
    return this.toDomain(row);
  }

  async update(category: MenuCategory): Promise<MenuCategory> {
    const [row] = await this.db
      .update(menuCategory)
      .set({
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        updatedAt: category.updatedAt,
      })
      .where(eq(menuCategory.id, category.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar la categoría de carta.');
    return this.toDomain(row);
  }

  private toDomain(row: Row): MenuCategory {
    return MenuCategory.fromPersistence({
      id: row.id,
      localId: row.localId,
      name: row.name,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
