import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { localImage } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { LocalImage } from '../../domain/entities/local-image.entity';
import type {
  LocalImageRepository,
  NewLocalImage,
} from '../../domain/ports/local-image.repository';

type Row = typeof localImage.$inferSelect;

@Injectable()
export class DrizzleLocalImageRepository implements LocalImageRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async listByLocal(localId: string): Promise<LocalImage[]> {
    const rows = await this.db
      .select()
      .from(localImage)
      .where(eq(localImage.localId, localId))
      .orderBy(asc(localImage.sortOrder));
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<LocalImage | null> {
    const [row] = await this.db.select().from(localImage).where(eq(localImage.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(image: NewLocalImage): Promise<LocalImage> {
    const [row] = await this.db
      .insert(localImage)
      .values({
        id: image.id,
        localId: image.localId,
        storageKey: image.storageKey,
        isMain: image.isMain,
        sortOrder: image.sortOrder,
        width: image.width,
        height: image.height,
        sizeBytes: image.sizeBytes,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la imagen de local');
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(localImage).where(eq(localImage.id, id));
  }

  async nextSortOrder(localId: string): Promise<number> {
    const [row] = await this.db
      .select({ sortOrder: localImage.sortOrder })
      .from(localImage)
      .where(eq(localImage.localId, localId))
      .orderBy(desc(localImage.sortOrder))
      .limit(1);
    return row ? row.sortOrder + 1 : 0;
  }

  async setMain(localId: string, imageId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(localImage)
        .set({ isMain: false })
        .where(eq(localImage.localId, localId));
      await tx.update(localImage).set({ isMain: true }).where(eq(localImage.id, imageId));
    });
  }

  async reorder(localId: string, orderedIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const [i, imageId] of orderedIds.entries()) {
        await tx.update(localImage).set({ sortOrder: i }).where(eq(localImage.id, imageId));
      }
    });
  }

  private toDomain(row: Row): LocalImage {
    return {
      id: row.id,
      localId: row.localId,
      storageKey: row.storageKey,
      isMain: row.isMain,
      sortOrder: row.sortOrder,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
    };
  }
}
