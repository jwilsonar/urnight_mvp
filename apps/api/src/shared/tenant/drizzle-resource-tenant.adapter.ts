import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { event, local, ticketType } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../database/drizzle.constants';
import type { ResourceTenantResolver } from './resource-tenant.port';

/** Resuelve la empresa dueña vía joins hacia local.company_id. */
@Injectable()
export class DrizzleResourceTenantResolver implements ResourceTenantResolver {
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

  async companyIdForTicketType(ticketTypeId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ companyId: local.companyId })
      .from(ticketType)
      .innerJoin(event, eq(event.id, ticketType.eventId))
      .innerJoin(local, eq(local.id, event.localId))
      .where(eq(ticketType.id, ticketTypeId))
      .limit(1);
    return row?.companyId ?? null;
  }
}
