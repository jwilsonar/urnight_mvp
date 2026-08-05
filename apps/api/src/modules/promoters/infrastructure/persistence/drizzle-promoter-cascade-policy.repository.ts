import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { event, local, order, promoterLocalPolicy } from "@urnight/db";
import { eq } from "drizzle-orm";
import {
  DRIZZLE,
  type DrizzleDb,
} from "../../../../shared/database/drizzle.constants";
import type {
  PromoterCascadePolicy,
  PromoterCascadePolicyRepository,
  ScopedPromoterCascadePolicy,
} from "../../domain/ports/promoter-cascade-policy.repository";

@Injectable()
export class DrizzlePromoterCascadePolicyRepository implements PromoterCascadePolicyRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByLocalId(
    localId: string,
  ): Promise<ScopedPromoterCascadePolicy | null> {
    const [row] = await this.db
      .select({
        companyId: local.companyId,
        localId: local.id,
        cascadeEnabled: promoterLocalPolicy.cascadeEnabled,
        cascadePercentage: promoterLocalPolicy.cascadePercentage,
      })
      .from(local)
      .leftJoin(promoterLocalPolicy, eq(promoterLocalPolicy.localId, local.id))
      .where(eq(local.id, localId))
      .limit(1);
    return row
      ? {
          companyId: row.companyId,
          policy: this.toPolicy(row),
        }
      : null;
  }

  async findByOrderId(orderId: string): Promise<PromoterCascadePolicy | null> {
    const [row] = await this.db
      .select({
        localId: local.id,
        cascadeEnabled: promoterLocalPolicy.cascadeEnabled,
        cascadePercentage: promoterLocalPolicy.cascadePercentage,
      })
      .from(order)
      .innerJoin(event, eq(order.eventId, event.id))
      .innerJoin(local, eq(event.localId, local.id))
      .leftJoin(promoterLocalPolicy, eq(promoterLocalPolicy.localId, local.id))
      .where(eq(order.id, orderId))
      .limit(1);
    return row ? this.toPolicy(row) : null;
  }

  async upsert(policy: PromoterCascadePolicy): Promise<void> {
    await this.db
      .insert(promoterLocalPolicy)
      .values({
        id: randomUUID(),
        localId: policy.localId,
        cascadeEnabled: policy.cascadeEnabled,
        cascadePercentage: policy.cascadePercentage.toFixed(2),
      })
      .onConflictDoUpdate({
        target: promoterLocalPolicy.localId,
        set: {
          cascadeEnabled: policy.cascadeEnabled,
          cascadePercentage: policy.cascadePercentage.toFixed(2),
          updatedAt: new Date(),
        },
      });
  }

  private toPolicy(row: {
    localId: string;
    cascadeEnabled: boolean | null;
    cascadePercentage: string | null;
  }): PromoterCascadePolicy {
    return {
      localId: row.localId,
      cascadeEnabled: row.cascadeEnabled ?? false,
      cascadePercentage:
        row.cascadePercentage === null ? 0 : Number(row.cascadePercentage),
    };
  }
}
