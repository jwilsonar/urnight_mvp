import { z } from 'zod';

export const updateLocalPolicySchema = z.object({
  reservationDepositPercent: z.number().int().min(0).max(100).multipleOf(5),
  birthdayWindowDays: z.number().int().min(0).max(365),
});
export type UpdateLocalPolicyDto = z.infer<typeof updateLocalPolicySchema>;

export const localPolicyResponseSchema = updateLocalPolicySchema.extend({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LocalPolicyResponse = z.infer<typeof localPolicyResponseSchema>;
