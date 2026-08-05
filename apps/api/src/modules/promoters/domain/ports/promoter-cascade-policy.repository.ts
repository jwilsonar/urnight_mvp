export interface PromoterCascadePolicy {
  localId: string;
  cascadeEnabled: boolean;
  /** Porcentaje de 0 a 100, tal como se configura en el contrato. */
  cascadePercentage: number;
}

export interface ScopedPromoterCascadePolicy {
  companyId: string;
  policy: PromoterCascadePolicy;
}

export interface PromoterCascadePolicyRepository {
  findByLocalId(localId: string): Promise<ScopedPromoterCascadePolicy | null>;
  findByOrderId(orderId: string): Promise<PromoterCascadePolicy | null>;
  upsert(policy: PromoterCascadePolicy): Promise<void>;
}

export const PROMOTER_CASCADE_POLICY_REPOSITORY = Symbol(
  "PROMOTER_CASCADE_POLICY_REPOSITORY",
);
