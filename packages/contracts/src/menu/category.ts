import { z } from 'zod';

const categoryNameSchema = z.string().trim().min(1).max(120);

export const createMenuCategorySchema = z.object({
  name: categoryNameSchema,
  displayOrder: z.number().int().min(0),
});
export type CreateMenuCategoryDto = z.infer<typeof createMenuCategorySchema>;

export const renameMenuCategorySchema = z.object({ name: categoryNameSchema });
export type RenameMenuCategoryDto = z.infer<typeof renameMenuCategorySchema>;

export const reorderMenuCategorySchema = z.object({
  displayOrder: z.number().int().min(0),
});
export type ReorderMenuCategoryDto = z.infer<typeof reorderMenuCategorySchema>;

export const menuCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  name: z.string(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuCategoryResponse = z.infer<typeof menuCategoryResponseSchema>;

export const menuCategoryListResponseSchema = z.array(menuCategoryResponseSchema);
export type MenuCategoryListResponse = z.infer<typeof menuCategoryListResponseSchema>;
