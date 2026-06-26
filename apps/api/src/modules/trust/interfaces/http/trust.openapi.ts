import {
  createReportSchema,
  createReviewSchema,
  reportResponseSchema,
  resolveReportSchema,
  reviewListResponseSchema,
  reviewResponseSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });

/** Definiciones OpenAPI del bounded context Trust. */
export function registerTrustDocs(): void {
  const CreateReview = registry.register('CreateReviewDto', createReviewSchema);
  const ReviewR = registry.register('ReviewResponse', reviewResponseSchema);
  const CreateReport = registry.register('CreateReportDto', createReportSchema);
  const ResolveReport = registry.register('ResolveReportDto', resolveReportSchema);
  const ReportR = registry.register('ReportResponse', reportResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/reviews',
    tags: ['Trust'],
    summary: 'Listar reseñas de un local o evento (público)',
    request: { query: z.object({ localId: z.string().uuid().optional(), eventId: z.string().uuid().optional() }) },
    responses: { 200: { description: 'Reseñas', ...json(reviewListResponseSchema) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/reviews',
    tags: ['Trust'],
    summary: 'Crear reseña (requiere entrada usada del target)',
    security: bearer,
    request: { body: json(CreateReview) },
    responses: {
      201: { description: 'Reseña creada', ...json(ReviewR) },
      403: problem('No elegible (sin entrada usada)'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/reports',
    tags: ['Trust'],
    summary: 'Reportar un local/evento',
    security: bearer,
    request: { body: json(CreateReport) },
    responses: { 201: { description: 'Reporte creado', ...json(ReportR) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/reports/{id}/resolve',
    tags: ['Trust'],
    summary: 'Resolver reporte (admin_local)',
    security: bearer,
    request: { params: z.object({ id: z.string().uuid() }), body: json(ResolveReport) },
    responses: {
      200: { description: 'Reporte resuelto', ...json(ReportR) },
      404: problem('No encontrado'),
    },
  });
}
