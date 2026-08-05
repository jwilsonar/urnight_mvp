import { Inject, Injectable } from "@nestjs/common";
import {
  PROMOTER_CASCADE_POLICY_REPOSITORY,
  type PromoterCascadePolicy,
  type PromoterCascadePolicyRepository,
} from "../../domain/ports/promoter-cascade-policy.repository";

const DISABLED_CASCADE: Omit<PromoterCascadePolicy, "localId"> = {
  cascadeEnabled: false,
  cascadePercentage: 0,
};

/** Resuelve la politica del local de la orden sin recalcular ventas historicas. */
@Injectable()
export class PromoterCascadeCommissionPolicy {
  constructor(
    @Inject(PROMOTER_CASCADE_POLICY_REPOSITORY)
    private readonly policies: PromoterCascadePolicyRepository,
  ) {}

  async forOrder(
    orderId: string,
  ): Promise<Omit<PromoterCascadePolicy, "localId">> {
    return (await this.policies.findByOrderId(orderId)) ?? DISABLED_CASCADE;
  }
}
