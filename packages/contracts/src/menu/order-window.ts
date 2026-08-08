import { z } from 'zod';

const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);

export const localOrderWindowInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startsAt: localTimeSchema,
  endsAt: localTimeSchema,
});
export type LocalOrderWindowInput = z.infer<typeof localOrderWindowInputSchema>;

export const replaceLocalOrderWindowsSchema = z.object({
  windows: z.array(localOrderWindowInputSchema).max(28),
});
export type ReplaceLocalOrderWindowsDto = z.infer<typeof replaceLocalOrderWindowsSchema>;

export const localOrderWindowResponseSchema = localOrderWindowInputSchema.extend({
  id: z.string().uuid(),
  localId: z.string().uuid(),
});
export type LocalOrderWindowResponse = z.infer<typeof localOrderWindowResponseSchema>;

export const localOrderWindowListResponseSchema = z.array(localOrderWindowResponseSchema);
export type LocalOrderWindowListResponse = z.infer<
  typeof localOrderWindowListResponseSchema
>;
