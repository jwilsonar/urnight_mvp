import {
  cancelEventSchema,
  createEventSchema,
  createTicketTypeSchema,
  eventListResponseSchema,
  eventResponseSchema,
  ticketTypeListResponseSchema,
  ticketTypeResponseSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });
const uuidParam = (name: string) => z.object({ [name]: z.string().uuid() });

/** Definiciones OpenAPI del bounded context Events & Ticket Types. */
export function registerEventsDocs(): void {
  const EventR = registry.register('EventResponse', eventResponseSchema);
  const CreateEvent = registry.register('CreateEventDto', createEventSchema);
  const CancelEvent = registry.register('CancelEventDto', cancelEventSchema);
  const TicketType = registry.register('TicketTypeResponse', ticketTypeResponseSchema);
  const CreateTicketType = registry.register('CreateTicketTypeDto', createTicketTypeSchema);

  registry.registerPath({
    method: 'get',
    path: '/events',
    tags: ['Events'],
    summary: 'Listar eventos publicados (público)',
    responses: { 200: { description: 'Eventos', ...json(eventListResponseSchema) } },
  });

  registry.registerPath({
    method: 'get',
    path: '/events/{slug}',
    tags: ['Events'],
    summary: 'Detalle de evento por slug (público)',
    request: { params: z.object({ slug: z.string() }) },
    responses: { 200: { description: 'Evento', ...json(EventR) }, 404: problem('No encontrado') },
  });

  registry.registerPath({
    method: 'get',
    path: '/events/{id}/ticket-types',
    tags: ['Events'],
    summary: 'Tipos de entrada del evento (público)',
    request: { params: uuidParam('id') },
    responses: { 200: { description: 'Tipos de entrada', ...json(ticketTypeListResponseSchema) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/events',
    tags: ['Events'],
    summary: 'Crear evento (admin_local)',
    security: bearer,
    request: { body: json(CreateEvent) },
    responses: {
      201: { description: 'Evento creado', ...json(EventR) },
      409: problem('slug en uso'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/events/{id}/publish',
    tags: ['Events'],
    summary: 'Publicar evento (admin_local)',
    security: bearer,
    request: { params: uuidParam('id') },
    responses: {
      200: { description: 'Evento publicado', ...json(EventR) },
      404: problem('No encontrado'),
      409: problem('No publicable'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/events/{id}/cancel',
    tags: ['Events'],
    summary: 'Cancelar evento (admin_local)',
    security: bearer,
    request: { params: uuidParam('id'), body: json(CancelEvent) },
    responses: {
      200: { description: 'Evento cancelado', ...json(EventR) },
      404: problem('No encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/ticket-types',
    tags: ['Events'],
    summary: 'Crear tipo de entrada (admin_local)',
    security: bearer,
    request: { body: json(CreateTicketType) },
    responses: {
      201: { description: 'Tipo de entrada creado', ...json(TicketType) },
      404: problem('Evento no encontrado'),
    },
  });
}
