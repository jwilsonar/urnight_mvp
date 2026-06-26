import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { event, local, userFavorite } from '@urnight/db';
import type { FavoriteTargetType } from '@urnight/contracts';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { Favorite } from '../../domain/entities/favorite.entity';
import type {
  EnrichedFavorite,
  UserFavoriteRepository,
} from '../../domain/ports/user-favorite.repository';

type FavoriteRow = typeof userFavorite.$inferSelect;

/** Adapter Drizzle del puerto UserFavoriteRepository. */
@Injectable()
export class DrizzleUserFavoriteRepository implements UserFavoriteRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /** Condición del target polimórfico (local|event) para un userId. */
  private targetWhere(userId: string, targetType: FavoriteTargetType, targetId: string) {
    const targetCol = targetType === 'local' ? userFavorite.localId : userFavorite.eventId;
    return and(eq(userFavorite.userId, userId), eq(targetCol, targetId));
  }

  async add(favorite: Favorite): Promise<Favorite> {
    const [row] = await this.db
      .insert(userFavorite)
      .values({
        id: favorite.id,
        userId: favorite.userId,
        targetType: favorite.targetType,
        localId: favorite.localId,
        eventId: favorite.eventId,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el favorito');
    return this.toDomain(row);
  }

  async remove(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .delete(userFavorite)
      .where(this.targetWhere(userId, targetType, targetId))
      .returning({ id: userFavorite.id });
    return rows.length > 0;
  }

  async listByUser(userId: string): Promise<Favorite[]> {
    const rows = await this.db
      .select()
      .from(userFavorite)
      .where(eq(userFavorite.userId, userId))
      .orderBy(desc(userFavorite.createdAt));
    return rows.map((r) => this.toDomain(r));
  }

  async listEnrichedByUser(userId: string): Promise<EnrichedFavorite[]> {
    const rows = await this.db
      .select({
        id: userFavorite.id,
        targetType: userFavorite.targetType,
        localId: userFavorite.localId,
        eventId: userFavorite.eventId,
        createdAt: userFavorite.createdAt,
        eventName: event.name,
        eventSlug: event.slug,
        eventFlyer: event.flyerUrl,
        eventStartsAt: event.startsAt,
        eventStatus: event.status,
        localName: local.name,
        localSlug: local.slug,
        localImage: local.mainImageKey,
        localStatus: local.status,
      })
      .from(userFavorite)
      .leftJoin(event, eq(userFavorite.eventId, event.id))
      .leftJoin(local, eq(userFavorite.localId, local.id))
      .where(eq(userFavorite.userId, userId))
      .orderBy(desc(userFavorite.createdAt));

    const result: EnrichedFavorite[] = [];
    for (const r of rows) {
      const isLocal = r.targetType === 'local';
      const targetId = isLocal ? r.localId : r.eventId;
      const name = isLocal ? r.localName : r.eventName;
      const slug = isLocal ? r.localSlug : r.eventSlug;
      // Target borrado de su tabla (left join sin match): favorito huérfano, se omite.
      if (!targetId || name == null || slug == null) continue;
      result.push({
        id: r.id,
        targetType: r.targetType as FavoriteTargetType,
        targetId,
        createdAt: r.createdAt,
        name,
        slug,
        imageRef: isLocal ? r.localImage : r.eventFlyer,
        startsAt: isLocal ? null : r.eventStartsAt,
        status: isLocal ? r.localStatus : r.eventStatus,
      });
    }
    return result;
  }

  async removeStaleEventFavorites(userId: string): Promise<number> {
    // Eventos "muertos" para el usuario: cancelados, finalizados o ya pasados.
    const staleEvents = this.db
      .select({ id: event.id })
      .from(event)
      .where(
        or(
          eq(event.status, 'cancelled'),
          eq(event.status, 'finished'),
          lt(event.startsAt, new Date()),
        ),
      );
    // localId null en favoritos de evento → inArray nunca matchea filas de local.
    const removed = await this.db
      .delete(userFavorite)
      .where(and(eq(userFavorite.userId, userId), inArray(userFavorite.eventId, staleEvents)))
      .returning({ id: userFavorite.id });
    return removed.length;
  }

  async exists(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: userFavorite.id })
      .from(userFavorite)
      .where(this.targetWhere(userId, targetType, targetId))
      .limit(1);
    return Boolean(row);
  }

  private toDomain(row: FavoriteRow): Favorite {
    return Favorite.fromPersistence({
      id: row.id,
      userId: row.userId,
      targetType: row.targetType as FavoriteTargetType,
      localId: row.localId,
      eventId: row.eventId,
      createdAt: row.createdAt,
    });
  }
}
