import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerCatalogDocs } from '../modules/catalog/interfaces/http/catalog.openapi';
import { registerCompaniesDocs } from '../modules/companies/interfaces/http/companies.openapi';
import { registerEventsDocs } from '../modules/events/interfaces/http/events.openapi';
import { registerIdentityDocs } from '../modules/identity/interfaces/http/identity.openapi';
import { registerMenuDocs } from '../modules/menu/interfaces/http/menu.openapi';
import { registerPromotersDocs } from '../modules/promoters/interfaces/http/promoters.openapi';
import { registerCheckoutDocs } from '../modules/ticketing/interfaces/http/checkout.openapi';
import { registerOpsDocs } from '../modules/ops/interfaces/http/ops.openapi';
import { registerTrustDocs } from '../modules/trust/interfaces/http/trust.openapi';
import { registry } from './registry';

let cached: ReturnType<OpenApiGeneratorV3['generateDocument']> | null = null;

/**
 * Ensambla el documento OpenAPI 3.0 a partir de los esquemas Zod de
 * @urnight/contracts. Cada bounded context aporta sus rutas/componentes.
 * `servers` apunta a /api/v1 para que "Try it out" use el prefijo correcto.
 */
export function buildOpenApiDocument() {
  if (cached) return cached;

  registerCatalogDocs();
  registerIdentityDocs();
  registerCompaniesDocs();
  registerMenuDocs();
  registerEventsDocs();
  registerCheckoutDocs();
  registerPromotersDocs();
  registerTrustDocs();
  registerOpsDocs();

  const generator = new OpenApiGeneratorV3(registry.definitions);
  cached = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'UrNight API',
      version: '1.0.0',
      description:
        'API del MVP UrNight — REST/JSON, prefijo /api/v1, errores Problem+JSON (RFC 7807). ' +
        'Autenticación: JWT propio (Bearer access token).',
    },
    servers: [{ url: '/api/v1' }],
  });
  return cached;
}
