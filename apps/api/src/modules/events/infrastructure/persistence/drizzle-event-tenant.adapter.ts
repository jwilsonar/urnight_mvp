import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { event, local } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import type { EventTenantPort } from '../../domain/ports/event-tenant.port';

/** Resuelve la empresa dueña vía join event→local (aislamiento tenant). */
@Injectable()
export class DrizzleEventTenantAdapter implements EventTenantPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async companyIdForLocal(localId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ companyId: local.companyId })
      .from(local)
      .where(eq(local.id, localId))
      .limit(1);
    return row?.companyId ?? null;
  }

  async companyIdForEvent(eventId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ companyId: local.companyId })
      .from(event)
      .innerJoin(local, eq(local.id, event.localId))
      .where(eq(event.id, eventId))
      .limit(1);
    return row?.companyId ?? null;
  }
}
