import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { problemDetailsSchema } from '@urnight/contracts';
import { z } from 'zod';

// Habilita `.openapi()` en Zod (mutación global del prototipo; idempotente).
extendZodWithOpenApi(z);

/**
 * Registro OpenAPI compartido. Cada módulo registra aquí sus componentes y rutas
 * (interfaces/http/<módulo>.openapi.ts). El documento se ensambla en build-document.ts.
 * Fuente única: los esquemas Zod de @urnight/contracts.
 */
export const registry = new OpenAPIRegistry();

/** Esquema de seguridad Bearer (JWT propio, access token). */
export const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

/** Componente reutilizable Problem+JSON (RFC 7807) para respuestas de error. */
export const problemSchema = registry.register('Problem', problemDetailsSchema);

/** Helper: cuerpo/respuesta application/json para un esquema. */
export const json = (schema: Parameters<typeof registry.register>[1]) => ({
  content: { 'application/json': { schema } },
});
