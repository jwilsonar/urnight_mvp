#!/usr/bin/env node
// Tests del mapa dominio↔documento. Sin dependencias: `node run-tests.mjs`.
//
// El mapa es la pieza que decide si un cambio avisa o no. Un patrón mal
// escrito no da error: simplemente deja de avisar para siempre, en silencio.
// De ahí que se cubra caso por caso.

import { esDocumentoDiagrama, normalizar, resolverDocumento } from '../mapa-dominios.mjs';

let fallos = 0;

function esperar(nombre, obtenido, esperado) {
  if (obtenido === esperado) {
    console.log(`  ok: ${nombre}`);
  } else {
    console.log(`  FALLO: ${nombre}\n    esperaba: ${esperado}\n    obtuvo:   ${obtenido}`);
    fallos += 1;
  }
}

function mapea(ruta, esperado) {
  esperar(ruta, resolverDocumento(ruta), esperado);
}

console.log('normalizar()');
esperar(
  'ruta absoluta de Windows → relativa POSIX',
  normalizar('A:\\URNIGHT\\urnight_restaurado\\apps\\api\\src\\modules\\events\\x.ts', 'A:\\URNIGHT\\urnight_restaurado'),
  'apps/api/src/modules/events/x.ts',
);
esperar('ruta ya relativa se conserva', normalizar('apps/web/app/checkout/page.tsx', 'A:/x'), 'apps/web/app/checkout/page.tsx');
esperar('sin ruta → null', normalizar(undefined, 'A:/x'), null);

console.log('\nAPI · un módulo, un dominio');
mapea('apps/api/src/modules/identity/application/use-cases/login.use-case.ts', '01-identidad-acceso.md');
mapea('apps/api/src/edge/guards/roles.guard.ts', '01-identidad-acceso.md');
mapea('apps/api/src/modules/trust/domain/entities/review.entity.ts', '02-descubrimiento-confianza.md');
mapea('apps/api/src/modules/companies/interfaces/http/companies.controller.ts', '03-empresas-locales.md');
mapea('apps/api/src/modules/events/application/use-cases/publish-event.use-case.ts', '04-eventos-inventario.md');
mapea('apps/api/src/modules/ticketing/application/use-cases/pay-order.use-case.ts', '05-entradas-validacion.md');
mapea('apps/api/src/modules/promoters/domain/ports/promoter.repository.ts', '06-promotores-atribucion.md');

console.log('\nDominios sin levantamiento y código transversal → sin aviso');
mapea('apps/api/src/modules/ops/application/use-cases/list-audit.use-case.ts', null);
mapea('apps/api/src/shared/adapters/storage/s3.adapter.ts', null);
mapea('packages/contracts/src/common/pagination.ts', null);

console.log('\nOtros clientes');
mapea('apps/worker/src/consumers/ticket-pdf.consumer.ts', '05-entradas-validacion.md');
mapea('apps/validator/app/scan.tsx', '05-entradas-validacion.md');
mapea('apps/mobile/app/index.tsx', '90-canales-moviles.md');

console.log('\nWeb · la regla específica gana a la genérica');
mapea('apps/web/app/(consumer)/account/page.tsx', '01-identidad-acceso.md');
mapea('apps/web/app/(consumer)/events/[slug]/page.tsx', '02-descubrimiento-confianza.md');
mapea('apps/web/app/(consumer)/afiliar/page.tsx', '03-empresas-locales.md');
mapea('apps/web/app/(consumer)/promotor/page.tsx', '06-promotores-atribucion.md');
mapea('apps/web/app/checkout/page.tsx', '05-entradas-validacion.md');
mapea('apps/web/app/p/[codigo]/route.ts', '06-promotores-atribucion.md');
mapea('apps/web/app/(panels)/panel/admin/events/page.tsx', '04-eventos-inventario.md');
mapea('apps/web/app/(panels)/panel/admin/locals/page.tsx', '03-empresas-locales.md');
mapea('apps/web/app/(panels)/panel/promoter/liquidaciones/page.tsx', '06-promotores-atribucion.md');
mapea('apps/web/app/(panels)/panel/validator/page.tsx', '05-entradas-validacion.md');
mapea('apps/web/app/(panels)/panel/superadmin/taxonomy/page.tsx', '02-descubrimiento-confianza.md');
mapea('apps/web/lib/api/orders.ts', '05-entradas-validacion.md');
mapea('apps/web/lib/api/admin.ts', null);

console.log('\nModelo de datos y contratos');
mapea('packages/db/src/schema/checkout.ts', '05-entradas-validacion.md');
mapea('packages/db/src/schema/outbox.ts', '05-entradas-validacion.md');
mapea('packages/db/src/schema/ops.ts', null);
mapea('packages/contracts/src/events/create-event.dto.ts', '04-eventos-inventario.md');

console.log('\nRuido descartado antes de consultar el mapa');
mapea('apps/api/src/modules/events/application/use-cases/publish-event.use-case.spec.ts', null);
mapea('apps/api/src/modules/ticketing/interfaces/http/orders.e2e.spec.ts', null);
mapea('apps/web/app/globals.css', null);
mapea('packages/db/migrations/0012_algo.sql', null);
mapea('package.json', null);
mapea('.claude/hooks/diagramas/detectar.mjs', null);

console.log('\nDocumentos de la serie');
esperar(
  'un documento de la serie se reconoce',
  esDocumentoDiagrama('docs/diagramas-secuencia/04-eventos-inventario.md'),
  '04-eventos-inventario.md',
);
esperar('el README no es un diagrama', esDocumentoDiagrama('docs/diagramas-secuencia/readme.md'), null);
esperar('otro doc cualquiera no lo es', esDocumentoDiagrama('docs/logging.md'), null);

console.log('');
if (fallos === 0) {
  console.log('Todos los tests pasaron.');
  process.exit(0);
}
console.log(`${fallos} test(s) fallaron.`);
process.exit(1);
