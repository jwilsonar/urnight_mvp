import {
  applyPromoterSchema,
  assignPromoterParentSchema,
  createPromoCodeSchema,
  createPromoterSchema,
  promoCodeResponseSchema,
  promoValidationResponseSchema,
  promoterApplicationResponseSchema,
  promoterAssociationResponseSchema,
  promoterCascadePolicyResponseSchema,
  promoterResponseSchema,
  promoterSalesResponseSchema,
  updatePromoterCascadePolicySchema,
  reviewPromoterApplicationSchema,
  validatePromoCodeSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });
const uuidParam = (name: string) => z.object({ [name]: z.string().uuid() });

/** Definiciones OpenAPI del bounded context Promoters & Promo Codes. */
export function registerPromotersDocs(): void {
  const Promoter = registry.register('PromoterResponse', promoterResponseSchema);
  const CreatePromoter = registry.register('CreatePromoterDto', createPromoterSchema);
  const Sales = registry.register('PromoterSalesResponse', promoterSalesResponseSchema);
  const Association = registry.register(
    'PromoterAssociationResponse',
    promoterAssociationResponseSchema,
  );
  const AssignParent = registry.register('AssignPromoterParentDto', assignPromoterParentSchema);
  const CascadePolicy = registry.register(
    'PromoterCascadePolicyResponse',
    promoterCascadePolicyResponseSchema,
  );
  const UpdateCascadePolicy = registry.register(
    'UpdatePromoterCascadePolicyDto',
    updatePromoterCascadePolicySchema,
  );
  const ApplyPromoter = registry.register('ApplyPromoterDto', applyPromoterSchema);
  const ReviewApplication = registry.register(
    'ReviewPromoterApplicationDto',
    reviewPromoterApplicationSchema,
  );
  const Application = registry.register(
    'PromoterApplicationResponse',
    promoterApplicationResponseSchema,
  );
  const CreatePromoCode = registry.register('CreatePromoCodeDto', createPromoCodeSchema);
  const PromoCodeR = registry.register('PromoCodeResponse', promoCodeResponseSchema);
  const ValidatePromo = registry.register('ValidatePromoCodeDto', validatePromoCodeSchema);
  const PromoValidation = registry.register('PromoValidationResponse', promoValidationResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/promoters',
    tags: ['Promoters'],
    summary: 'Invitar promotor por correo (admin_local). Queda pending hasta confirmar',
    security: bearer,
    request: { body: json(CreatePromoter) },
    responses: { 201: { description: 'Promotor invitado (pending)', ...json(Promoter) } },
  });

  registry.registerPath({
    method: 'get',
    path: '/promoters/me/associations',
    tags: ['Promoters'],
    summary: 'Invitaciones de asociación pendientes del usuario autenticado',
    security: bearer,
    responses: { 200: { description: 'Lista de invitaciones', ...json(z.array(Association)) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/promoters/{id}/confirm',
    tags: ['Promoters'],
    summary: 'El invitado confirma la asociación (activa + link + rol promoter)',
    security: bearer,
    request: { params: uuidParam('id') },
    responses: {
      200: { description: 'Asociación confirmada', ...json(Promoter) },
      403: problem('La invitación no corresponde al actor'),
      404: problem('Promotor no encontrado'),
      409: problem('La asociación ya no está pendiente'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/promoters/{id}/reject',
    tags: ['Promoters'],
    summary: 'El invitado rechaza la asociación',
    security: bearer,
    request: { params: uuidParam('id') },
    responses: {
      200: { description: 'Asociación rechazada', ...json(Association) },
      403: problem('La invitación no corresponde al actor'),
      404: problem('Promotor no encontrado'),
      409: problem('La asociación ya no está pendiente'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/promoters/{id}/sales',
    tags: ['Promoters'],
    summary: 'Ventas/comisiones del promotor',
    security: bearer,
    request: { params: uuidParam('id') },
    responses: {
      200: { description: 'Resumen de ventas', ...json(Sales) },
      404: problem('Promotor no encontrado'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/promoters/{id}/parent',
    tags: ['Promoters'],
    summary: 'Asignar o retirar el cabeza de equipo de un promotor',
    security: bearer,
    request: { params: uuidParam('id'), body: json(AssignParent) },
    responses: {
      200: { description: 'Jerarquia actualizada', ...json(Promoter) },
      404: problem('Promotor o cabeza no encontrado'),
      409: problem('Ciclo de jerarquia'),
      422: problem('Empresa distinta o profundidad excedida'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/promoters/locals/{localId}/cascade-policy',
    tags: ['Promoters'],
    summary: 'Consultar la politica local de comision en cascada',
    security: bearer,
    request: { params: uuidParam('localId') },
    responses: {
      200: { description: 'Politica vigente', ...json(CascadePolicy) },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/promoters/locals/{localId}/cascade-policy',
    tags: ['Promoters'],
    summary: 'Configurar la comision en cascada de un local',
    security: bearer,
    request: {
      params: uuidParam('localId'),
      body: json(UpdateCascadePolicy),
    },
    responses: {
      200: { description: 'Politica actualizada', ...json(CascadePolicy) },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/promoters/referrals/{code}/click',
    tags: ['Promoters'],
    summary: 'Registrar clic en link de referido (público)',
    request: { params: z.object({ code: z.string() }) },
    responses: { 204: { description: 'Clic registrado' } },
  });

  registry.registerPath({
    method: 'post',
    path: '/promoter-applications',
    tags: ['Promoters'],
    summary: 'Postular para ser promotor (público)',
    request: { body: json(ApplyPromoter) },
    responses: { 201: { description: 'Postulación creada', ...json(Application) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/promoter-applications/{id}/review',
    tags: ['Promoters'],
    summary: 'Revisar postulación (admin_local)',
    security: bearer,
    request: { params: uuidParam('id'), body: json(ReviewApplication) },
    responses: {
      200: { description: 'Postulación revisada', ...json(Application) },
      404: problem('No encontrada'),
      409: problem('Ya revisada'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/promo-codes',
    tags: ['Promo Codes'],
    summary: 'Crear código promocional (admin_local)',
    security: bearer,
    request: { body: json(CreatePromoCode) },
    responses: {
      201: { description: 'Código creado', ...json(PromoCodeR) },
      409: problem('Código ya existe'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/promo-codes/validate',
    tags: ['Promo Codes'],
    summary: 'Validar código y previsualizar descuento (público)',
    request: { body: json(ValidatePromo) },
    responses: { 200: { description: 'Resultado de validación', ...json(PromoValidation) } },
  });
}
