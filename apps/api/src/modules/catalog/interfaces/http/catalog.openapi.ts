import { createZoneSchema, zoneListResponseSchema, zoneResponseSchema } from '@urnight/contracts';
import { json, problemSchema, registry } from '../../../../openapi/registry';

/** Definiciones OpenAPI del bounded context Catalog (rutas /zones). */
export function registerCatalogDocs(): void {
  const ZoneResponse = registry.register('ZoneResponse', zoneResponseSchema);
  const CreateZoneDto = registry.register('CreateZoneDto', createZoneSchema);

  registry.registerPath({
    method: 'get',
    path: '/zones',
    tags: ['Catalog'],
    summary: 'Listar zonas (público)',
    responses: {
      200: { description: 'Lista de zonas', ...json(zoneListResponseSchema) },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/zones',
    tags: ['Catalog'],
    summary: 'Crear zona',
    request: { body: json(CreateZoneDto) },
    responses: {
      201: { description: 'Zona creada', ...json(ZoneResponse) },
      422: { description: 'Validación fallida', ...json(problemSchema) },
    },
  });

  // Taxonomías hermanas (misma forma que zone).
  for (const r of [
    { path: '/local-types', label: 'tipos de local' },
    { path: '/music-genres', label: 'géneros musicales' },
    { path: '/tags', label: 'etiquetas' },
  ]) {
    registry.registerPath({
      method: 'get',
      path: r.path,
      tags: ['Catalog'],
      summary: `Listar ${r.label} (público)`,
      responses: { 200: { description: `Lista de ${r.label}`, ...json(zoneListResponseSchema) } },
    });
    registry.registerPath({
      method: 'post',
      path: r.path,
      tags: ['Catalog'],
      summary: `Crear ${r.label}`,
      request: { body: json(CreateZoneDto) },
      responses: {
        201: { description: 'Creado', ...json(ZoneResponse) },
        422: { description: 'Validación fallida', ...json(problemSchema) },
      },
    });
  }
}
