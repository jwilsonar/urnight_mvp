import {
  authTokensResponseSchema,
  googleLoginSchema,
  grantRoleSchema,
  legalAcceptanceResponseSchema,
  legalDocTypeSchema,
  legalDocumentResponseSchema,
  loginSchema,
  preferenceResponseSchema,
  publishLegalDocumentSchema,
  refreshSchema,
  registerSchema,
  roleAssignmentResponseSchema,
  updatePreferenceSchema,
  userProfileResponseSchema,
  verifyEmailSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });

/** Definiciones OpenAPI del bounded context Identity, Access & Legal. */
export function registerIdentityDocs(): void {
  // --- Componentes reutilizables (fuente: @urnight/contracts) ---
  const RegisterDto = registry.register('RegisterDto', registerSchema);
  const LoginDto = registry.register('LoginDto', loginSchema);
  const GoogleLoginDto = registry.register('GoogleLoginDto', googleLoginSchema);
  const RefreshDto = registry.register('RefreshDto', refreshSchema);
  const VerifyEmailDto = registry.register('VerifyEmailDto', verifyEmailSchema);
  const AuthTokens = registry.register('AuthTokensResponse', authTokensResponseSchema);
  const UserProfile = registry.register('UserProfileResponse', userProfileResponseSchema);
  const GrantRoleDto = registry.register('GrantRoleDto', grantRoleSchema);
  const RoleAssignment = registry.register('RoleAssignmentResponse', roleAssignmentResponseSchema);
  const UpdatePreferenceDto = registry.register('UpdatePreferenceDto', updatePreferenceSchema);
  const Preference = registry.register('PreferenceResponse', preferenceResponseSchema);
  const PublishLegalDto = registry.register('PublishLegalDocumentDto', publishLegalDocumentSchema);
  const LegalDocument = registry.register('LegalDocumentResponse', legalDocumentResponseSchema);
  const LegalAcceptance = registry.register('LegalAcceptanceResponse', legalAcceptanceResponseSchema);

  // --- Auth ---
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Registro con email + contraseña (18+, documento único)',
    request: { body: json(RegisterDto) },
    responses: {
      201: { description: 'Usuario creado + tokens', ...json(AuthTokens) },
      409: problem('Email o documento ya registrado'),
      422: problem('Validación fallida (incluye menor de 18)'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Login con email + contraseña',
    request: { body: json(LoginDto) },
    responses: {
      200: { description: 'Tokens emitidos', ...json(AuthTokens) },
      401: problem('Credenciales inválidas'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/google',
    tags: ['Auth'],
    summary: 'Login federado con Google (OIDC)',
    request: { body: json(GoogleLoginDto) },
    responses: {
      200: { description: 'Tokens emitidos', ...json(AuthTokens) },
      401: problem('Token de Google inválido'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Renovar access token con el refresh',
    request: { body: json(RefreshDto) },
    responses: {
      200: { description: 'Nuevo par de tokens', ...json(AuthTokens) },
      401: problem('Refresh inválido o expirado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/verify-email',
    tags: ['Auth'],
    summary: 'Verificar email con el token enviado por correo',
    request: { body: json(VerifyEmailDto) },
    responses: {
      200: { description: 'Estado de verificación', ...json(z.object({ emailVerified: z.boolean() })) },
      401: problem('Token inválido o expirado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    summary: 'Perfil del usuario autenticado + roles',
    security: bearer,
    responses: {
      200: { description: 'Perfil', ...json(UserProfile) },
      401: problem('No autenticado'),
    },
  });

  // --- Preferences ---
  registry.registerPath({
    method: 'patch',
    path: '/me/preferences',
    tags: ['Preferences'],
    summary: 'Actualizar preferencias del usuario',
    security: bearer,
    request: { body: json(UpdatePreferenceDto) },
    responses: {
      200: { description: 'Preferencias actualizadas', ...json(Preference) },
      401: problem('No autenticado'),
      404: problem('Preferencias no encontradas'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/me/onboarding',
    tags: ['Preferences'],
    summary: 'Completar onboarding',
    security: bearer,
    responses: {
      200: { description: 'Onboarding completado', ...json(Preference) },
      401: problem('No autenticado'),
      404: problem('Preferencias no encontradas'),
    },
  });

  // --- RBAC ---
  registry.registerPath({
    method: 'post',
    path: '/users/{userId}/roles',
    tags: ['RBAC'],
    summary: 'Otorgar un rol con scope multi-tenant (super_admin)',
    security: bearer,
    request: { params: z.object({ userId: z.string().uuid() }), body: json(GrantRoleDto) },
    responses: {
      201: { description: 'Rol otorgado', ...json(RoleAssignment) },
      403: problem('Rol insuficiente'),
      404: problem('Usuario o rol no encontrado'),
      409: problem('El rol ya estaba otorgado en ese scope'),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/users/{userId}/roles/{assignmentId}',
    tags: ['RBAC'],
    summary: 'Revocar una asignación de rol (super_admin)',
    security: bearer,
    request: {
      params: z.object({ userId: z.string().uuid(), assignmentId: z.string().uuid() }),
    },
    responses: {
      204: { description: 'Rol revocado' },
      403: problem('Rol insuficiente'),
      404: problem('Asignación no encontrada'),
    },
  });

  // --- Legal ---
  registry.registerPath({
    method: 'post',
    path: '/legal-documents',
    tags: ['Legal'],
    summary: 'Publicar una versión de documento legal (super_admin)',
    security: bearer,
    request: { body: json(PublishLegalDto) },
    responses: {
      201: { description: 'Documento publicado', ...json(LegalDocument) },
      403: problem('Rol insuficiente'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/legal-documents/current',
    tags: ['Legal'],
    summary: 'Documento legal vigente de un tipo (público)',
    request: { query: z.object({ docType: legalDocTypeSchema }) },
    responses: {
      200: { description: 'Documento vigente', ...json(LegalDocument) },
      404: problem('No hay documento vigente'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/legal-documents/{id}/accept',
    tags: ['Legal'],
    summary: 'Aceptar un documento legal',
    security: bearer,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      201: { description: 'Aceptación registrada', ...json(LegalAcceptance) },
      401: problem('No autenticado'),
      404: problem('Documento no encontrado'),
    },
  });
}
