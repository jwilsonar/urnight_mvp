import { z } from "zod";

/** Asigna o retira el cabeza de equipo de un promotor. */
export const assignPromoterParentSchema = z.object({
  parentPromoterId: z.string().uuid().nullable(),
});
export type AssignPromoterParentDto = z.infer<
  typeof assignPromoterParentSchema
>;

/** Politica local opt-in; el porcentaje se expresa de 0 a 100. */
export const updatePromoterCascadePolicySchema = z.object({
  cascadeEnabled: z.boolean(),
  cascadePercentage: z.number().min(0).max(100),
});
export type UpdatePromoterCascadePolicyDto = z.infer<
  typeof updatePromoterCascadePolicySchema
>;

export const promoterCascadePolicyResponseSchema =
  updatePromoterCascadePolicySchema.extend({
    localId: z.string().uuid(),
  });
export type PromoterCascadePolicyResponse = z.infer<
  typeof promoterCascadePolicyResponseSchema
>;
