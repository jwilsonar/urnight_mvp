import { z } from 'zod';

const ruc = z.string().regex(/^\d{11}$/, 'RUC debe tener 11 dígitos');

/** Crear empresa (COMPANY §4.1). */
export const createCompanySchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  ruc,
  commercialName: z.string().trim().min(2).max(200),
  contactEmail: z.string().email().max(160).optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
});
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

/** Actualizar perfil de empresa (self, #29). RUC/razón social inmutables. */
export const updateCompanySchema = z
  .object({
    commercialName: z.string().trim().min(2).max(200).optional(),
    contactEmail: z.string().email().max(160).nullable().optional(),
    contactPhone: z.string().trim().min(6).max(20).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar' });
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

export const companyResponseSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string(),
  ruc: z.string(),
  commercialName: z.string(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  status: z.enum(['draft', 'active', 'suspended']),
  createdAt: z.string(),
});
export type CompanyResponse = z.infer<typeof companyResponseSchema>;
