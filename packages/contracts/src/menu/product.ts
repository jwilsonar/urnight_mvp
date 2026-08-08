import { z } from 'zod';

const currencySchema = z.string().length(3).transform((value) => value.toUpperCase());
const amountSchema = z.number().positive().multipleOf(0.01);
const productNameSchema = z.string().trim().min(1).max(160);
const storageKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => !/^https?:\/\//i.test(value), 'imageKey debe ser una key de S3');

export const createMenuProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: productNameSchema,
  description: z.string().trim().max(5000).optional(),
  imageKey: storageKeySchema.optional(),
  isAvailable: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  priceAmount: amountSchema,
  priceCurrency: currencySchema.default('PEN'),
});
export type CreateMenuProductDto = z.infer<typeof createMenuProductSchema>;

export const updateMenuProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: productNameSchema.optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  imageKey: storageKeySchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});
export type UpdateMenuProductDto = z.infer<typeof updateMenuProductSchema>;

export const setMenuProductAvailabilitySchema = z.object({ isAvailable: z.boolean() });
export type SetMenuProductAvailabilityDto = z.infer<
  typeof setMenuProductAvailabilitySchema
>;

export const changeMenuProductPriceSchema = z.object({
  amount: amountSchema,
  currency: currencySchema.default('PEN'),
});
export type ChangeMenuProductPriceDto = z.infer<typeof changeMenuProductPriceSchema>;

export const menuProductResponseSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  localId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isAvailable: z.boolean(),
  tags: z.array(z.string()),
  priceAmount: z.number(),
  priceCurrency: z.string().length(3),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuProductResponse = z.infer<typeof menuProductResponseSchema>;

export const menuProductListResponseSchema = z.array(menuProductResponseSchema);
export type MenuProductListResponse = z.infer<typeof menuProductListResponseSchema>;

export const menuPriceChangeResponseSchema = z.object({
  productId: z.string().uuid(),
  previous: z.object({ amount: z.number(), currency: z.string().length(3) }),
  current: z.object({ amount: z.number(), currency: z.string().length(3) }),
});
export type MenuPriceChangeResponse = z.infer<typeof menuPriceChangeResponseSchema>;
