import { z } from 'zod';
import {
  DOCUMENT_TYPES,
  adultBirthDateSchema,
  documentNumberSchema,
  fullNameSchema,
  isValidDocumentNumber,
  peruMobileSchema,
} from '../common/rules';

/**
 * Tipo de documento (§4.1 DocumentType). varchar+CHECK en DB, lowercase
 * canónico. La lista vive en `common/rules` junto al largo de cada documento,
 * para que el tipo y su validación no puedan separarse.
 */
export { DOCUMENT_TYPES };
export type { DocumentType } from '../common/rules';
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

/** Proveedor de autenticación (§4.1 AuthProvider). */
export const AUTH_PROVIDERS = ['email', 'google'] as const;
export const authProviderSchema = z.enum(AUTH_PROVIDERS);
export type AuthProvider = z.infer<typeof authProviderSchema>;

const email = z.string().trim().toLowerCase().email().max(160);
/** bcrypt trunca a 72 bytes → cota superior explícita. */
const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula')
  .regex(/\d/, 'La contraseña debe incluir al menos un número')
  .regex(/[^A-Za-z0-9\s]/, 'La contraseña debe incluir al menos un símbolo');
const fullName = fullNameSchema;
const phone = peruMobileSchema.optional();

/**
 * Registro con email+contraseña (§4.1 + invariante 18+).
 *
 * El número de documento se valida contra su propio tipo en un `superRefine`:
 * el largo de un DNI no es el de un pasaporte, y aceptar cualquier cosa de 8 a
 * 20 caracteres dejaba pasar documentos que en la puerta no cuadran.
 */
export const registerObjectSchema = z.object({
  fullName,
  email,
  password,
  birthDate: adultBirthDateSchema,
  documentType: documentTypeSchema,
  documentNumber: documentNumberSchema,
  phone,
  acceptsMarketing: z.boolean().default(false),
});

/**
 * Valida que el número corresponda a su tipo de documento. Se expone aparte del
 * esquema para que los formularios puedan extender `registerObjectSchema` con
 * sus propios mensajes y seguir aplicando exactamente esta regla.
 */
export function refineDocumentPair(
  value: { documentType: z.infer<typeof documentTypeSchema>; documentNumber: string },
  ctx: z.RefinementCtx,
  message = 'El número no corresponde al tipo de documento',
): void {
  if (!isValidDocumentNumber(value.documentType, value.documentNumber)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['documentNumber'], message });
  }
}

export const registerSchema = registerObjectSchema.superRefine((value, ctx) =>
  refineDocumentPair(value, ctx),
);
export type RegisterDto = z.infer<typeof registerSchema>;

/** Login email+contraseña. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

/** Login federado: ID token de Google (OIDC). */
export const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;

/** Renovación de access token con el refresh token. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

/** Cierre de sesión: revoca (rota fuera de circulación) el refresh token actual. */
export const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});
export type LogoutDto = z.infer<typeof logoutSchema>;

/** Verificación de email vía token firmado. */
export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

/** Par de tokens emitido por la API (JWT propio: access corto + refresh). */
export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int(),
});
export type AuthTokensResponse = z.infer<typeof authTokensResponseSchema>;

/** Perfil del usuario autenticado (camelCase, fechas ISO). */
export const userProfileResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  authProvider: authProviderSchema,
  emailVerified: z.boolean(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  documentType: documentTypeSchema.nullable(),
  documentNumber: z.string().nullable(),
  /** Fecha de nacimiento (YYYY-MM-DD). Null si la cuenta no tiene identidad (p. ej. alta Google). */
  birthDate: z.string().nullable(),
  roles: z.array(z.string()),
  onboardingCompleted: z.boolean(),
  createdAt: z.string(),
});
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
