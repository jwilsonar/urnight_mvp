import {
  companyResponseSchema,
  createCompanySchema,
  createLocalSchema,
  localListResponseSchema,
  localResponseSchema,
  requestVerificationSchema,
  reviewAffiliationSchema,
  reviewVerificationSchema,
  submitAffiliationSchema,
  suspendLocalSchema,
  affiliationResponseSchema,
  verificationResponseSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });
const uuidParam = (name: string) => z.object({ [name]: z.string().uuid() });

/** Definiciones OpenAPI del bounded context Companies & Locals. */
export function registerCompaniesDocs(): void {
  const Company = registry.register('CompanyResponse', companyResponseSchema);
  const CreateCompany = registry.register('CreateCompanyDto', createCompanySchema);
  const LocalR = registry.register('LocalResponse', localResponseSchema);
  const CreateLocal = registry.register('CreateLocalDto', createLocalSchema);
  const SuspendLocal = registry.register('SuspendLocalDto', suspendLocalSchema);
  const RequestVerification = registry.register('RequestVerificationDto', requestVerificationSchema);
  const ReviewVerification = registry.register('ReviewVerificationDto', reviewVerificationSchema);
  const Verification = registry.register('VerificationResponse', verificationResponseSchema);
  const SubmitAffiliation = registry.register('SubmitAffiliationDto', submitAffiliationSchema);
  const ReviewAffiliation = registry.register('ReviewAffiliationDto', reviewAffiliationSchema);
  const Affiliation = registry.register('AffiliationResponse', affiliationResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/companies',
    tags: ['Companies'],
    summary: 'Crear empresa (super_admin)',
    security: bearer,
    request: { body: json(CreateCompany) },
    responses: {
      201: { description: 'Empresa creada', ...json(Company) },
      409: problem('RUC ya registrado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals',
    tags: ['Locals'],
    summary: 'Listar locales visibles (público)',
    responses: { 200: { description: 'Locales', ...json(localListResponseSchema) } },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{slug}',
    tags: ['Locals'],
    summary: 'Detalle de local por slug (público)',
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: { description: 'Local', ...json(LocalR) },
      404: problem('Local no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals',
    tags: ['Locals'],
    summary: 'Crear local (admin_local / super_admin)',
    security: bearer,
    request: { body: json(CreateLocal) },
    responses: {
      201: { description: 'Local creado', ...json(LocalR) },
      403: problem('Tenant no permitido'),
      404: problem('Empresa no encontrada'),
      409: problem('slug en uso'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{id}/publish',
    tags: ['Locals'],
    summary: 'Publicar local',
    security: bearer,
    request: { params: uuidParam('id') },
    responses: { 200: { description: 'Publicado', ...json(LocalR) }, 404: problem('No encontrado') },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{id}/suspend',
    tags: ['Locals'],
    summary: 'Suspender local',
    security: bearer,
    request: { params: uuidParam('id'), body: json(SuspendLocal) },
    responses: { 200: { description: 'Suspendido', ...json(LocalR) }, 404: problem('No encontrado') },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{id}/verifications',
    tags: ['Locals'],
    summary: 'Solicitar verificación del local',
    security: bearer,
    request: { params: uuidParam('id'), body: json(RequestVerification) },
    responses: {
      201: { description: 'Verificación solicitada', ...json(Verification) },
      404: problem('Local no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/local-verifications/{id}/review',
    tags: ['Locals'],
    summary: 'Revisar verificación (super_admin)',
    security: bearer,
    request: { params: uuidParam('id'), body: json(ReviewVerification) },
    responses: {
      200: { description: 'Verificación revisada', ...json(Verification) },
      404: problem('Verificación no encontrada'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/affiliation-requests',
    tags: ['Companies'],
    summary: 'Enviar solicitud de afiliación (público)',
    request: { body: json(SubmitAffiliation) },
    responses: { 201: { description: 'Solicitud creada', ...json(Affiliation) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/affiliation-requests/{id}/review',
    tags: ['Companies'],
    summary: 'Revisar solicitud: aprobar (crea empresa+local) o rechazar (super_admin)',
    security: bearer,
    request: { params: uuidParam('id'), body: json(ReviewAffiliation) },
    responses: {
      200: { description: 'Solicitud revisada', ...json(Affiliation) },
      404: problem('Solicitud no encontrada'),
      409: problem('Solicitud ya revisada'),
    },
  });
}
