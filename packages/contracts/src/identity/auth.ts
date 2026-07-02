import { z } from 'zod';
import { adultBirthDateSchema, documentNumberSchema } from '../common/rules';

/** Tipo de documento (§4.1 DocumentType). varchar+CHECK en DB, lowercase canónico. */
export const DOCUMENT_TYPES = ['dni', 'ce', 'passport'] as const;
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentType = z.infer<typeof documentTypeSchema>;

/** Proveedor de autenticación (§4.1 AuthProvider). */
export const AUTH_PROVIDERS = ['email', 'google'] as const;
export const authProviderSchema = z.enum(AUTH_PROVIDERS);
export type AuthProvider = z.infer<typeof authProviderSchema>;

const email = z.string().trim().toLowerCase().email().max(160);
/** bcrypt trunca a 72 bytes → cota superior explícita. */
const password = z.string().min(8).max(72);
const fullName = z.string().trim().min(2).max(120);
const phone = z.string().trim().min(6).max(20).optional();

/** Registro con email+contraseña (§4.1 + invariante 18+). */
export const registerSchema = z.object({
  fullName,
  email,
  password,
  birthDate: adultBirthDateSchema,
  documentType: documentTypeSchema,
  documentNumber: documentNumberSchema,
  phone,
  acceptsMarketing: z.boolean().default(false),
});
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
