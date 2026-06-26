import {
  analyticsAckSchema,
  createSupportTicketSchema,
  notificationListResponseSchema,
  platformSettingResponseSchema,
  recordAnalyticsSchema,
  resolveSupportTicketSchema,
  supportTicketResponseSchema,
  upsertPlatformSettingSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });

/** Definiciones OpenAPI del bounded context Ops & Platform. */
export function registerOpsDocs(): void {
  const Setting = registry.register('PlatformSettingResponse', platformSettingResponseSchema);
  const UpsertSetting = registry.register('UpsertPlatformSettingDto', upsertPlatformSettingSchema);
  const CreateSupport = registry.register('CreateSupportTicketDto', createSupportTicketSchema);
  const ResolveSupport = registry.register('ResolveSupportTicketDto', resolveSupportTicketSchema);
  const Support = registry.register('SupportTicketResponse', supportTicketResponseSchema);
  const RecordAnalytics = registry.register('RecordAnalyticsDto', recordAnalyticsSchema);
  const AnalyticsAck = registry.register('AnalyticsAck', analyticsAckSchema);

  registry.registerPath({
    method: 'get',
    path: '/platform-settings/{key}',
    tags: ['Ops'],
    summary: 'Leer ajuste de plataforma (público)',
    request: { params: z.object({ key: z.string() }) },
    responses: { 200: { description: 'Ajuste', ...json(Setting) }, 404: problem('No encontrado') },
  });

  registry.registerPath({
    method: 'put',
    path: '/platform-settings',
    tags: ['Ops'],
    summary: 'Crear/actualizar ajuste (super_admin)',
    security: bearer,
    request: { body: json(UpsertSetting) },
    responses: { 200: { description: 'Ajuste guardado', ...json(Setting) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/support-tickets',
    tags: ['Ops'],
    summary: 'Abrir ticket de soporte (admin_local)',
    security: bearer,
    request: { body: json(CreateSupport) },
    responses: { 201: { description: 'Ticket creado', ...json(Support) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/support-tickets/{id}/status',
    tags: ['Ops'],
    summary: 'Cambiar estado de ticket (super_admin)',
    security: bearer,
    request: { params: z.object({ id: z.string().uuid() }), body: json(ResolveSupport) },
    responses: {
      200: { description: 'Ticket actualizado', ...json(Support) },
      404: problem('No encontrado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/notifications/me',
    tags: ['Ops'],
    summary: 'Mis notificaciones',
    security: bearer,
    responses: { 200: { description: 'Notificaciones', ...json(notificationListResponseSchema) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/analytics/events',
    tags: ['Ops'],
    summary: 'Ingesta de evento de analítica (público)',
    request: { body: json(RecordAnalytics) },
    responses: { 202: { description: 'Registrado', ...json(AnalyticsAck) } },
  });
}
