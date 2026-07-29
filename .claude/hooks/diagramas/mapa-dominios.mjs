// Mapa: archivo de código → documento de docs/diagramas-secuencia/.
//
// Es el ÚNICO punto de ajuste del hook. Si un flujo cambia de dominio, se
// mueve una regla aquí y todo lo demás sigue funcionando.
//
// Los números de documento son los dominios del DER (PROJECT_SPECS.md §4.1);
// el rango 9x es transversal. Ver docs/diagramas-secuencia/README.md §2.

export const DIR_DIAGRAMAS = 'docs/diagramas-secuencia';

export const DOCUMENTOS = {
  '01': '01-identidad-acceso.md',
  '02': '02-descubrimiento-confianza.md',
  '03': '03-empresas-locales.md',
  '04': '04-eventos-inventario.md',
  '05': '05-entradas-validacion.md',
  '06': '06-promotores-atribucion.md',
  '90': '90-canales-moviles.md',
};

// Cambios que nunca alteran un flujo documentado. Se descartan antes de
// consultar las reglas: evitan avisos por tests, build o assets.
const IGNORADOS = [
  /\.(spec|test|e2e)\.[cm]?[tj]sx?$/,
  /(^|\/)__tests__\//,
  /(^|\/)node_modules\//,
  /(^|\/)(dist|build|coverage|\.next|\.expo|storybook-static)\//,
  /(^|\/)\.claude\//,
  /(^|\/)packages\/db\/migrations\//,
  /(^|\/)packages\/(config|ui)\//,
  /\.(json|lock|ya?ml|css|svg|png|jpe?g|webp|ico|snap|d\.ts)$/,
];

// Orden significativo: gana la primera coincidencia. Las rutas más
// específicas van antes que su carpeta contenedora.
//
// `null` = pertenece a un dominio sin levantamiento (dominio 8 · Ops &
// Platform) o a código transversal. Se reconoce explícitamente para que no
// parezca un olvido del mapa.
const REGLAS = [
  // ── API · un módulo = un dominio ──────────────────────────────────────
  [/^apps\/api\/src\/modules\/identity\//, '01'],
  [/^apps\/api\/src\/edge\//, '01'], // guards, tenant scope, RBAC
  [/^apps\/api\/src\/modules\/catalog\//, '02'],
  [/^apps\/api\/src\/modules\/trust\//, '02'],
  [/^apps\/api\/src\/modules\/companies\//, '03'],
  [/^apps\/api\/src\/modules\/uploads\//, '03'],
  [/^apps\/api\/src\/modules\/events\//, '04'],
  [/^apps\/api\/src\/modules\/ticketing\//, '05'],
  [/^apps\/api\/src\/modules\/promoters\//, '06'],
  [/^apps\/api\/src\/modules\/ops\//, null], // dominio 8, aún sin documento
  [/^apps\/api\/src\/(shared|config|openapi|health)\//, null],

  // ── Otros clientes ────────────────────────────────────────────────────
  [/^apps\/worker\//, '05'], // outbox → relay → PDF de entradas
  [/^apps\/validator\//, '05'], // validación en puerta
  [/^apps\/mobile\//, '90'],

  // ── Web · auth y cuenta ───────────────────────────────────────────────
  [/^apps\/web\/app\/\(auth\)\//, '01'],
  [/^apps\/web\/app\/\(consumer\)\/account\//, '01'],
  [/^apps\/web\/lib\/api\/auth\//, '01'],
  [/^apps\/web\/lib\/api\/identity\.ts$/, '01'],

  // ── Web · rutas de consumidor con dominio propio ──────────────────────
  [/^apps\/web\/app\/\(consumer\)\/afiliar\//, '03'],
  [/^apps\/web\/app\/onboarding\//, '03'],
  [/^apps\/web\/app\/\(consumer\)\/promotor\//, '06'],
  [/^apps\/web\/app\/\(consumer\)\/canjear\//, '05'],
  [/^apps\/web\/app\/\(consumer\)\//, '02'], // catálogo, fichas, reseñas
  [/^apps\/web\/app\/p\//, '06'], // enlace corto de referido

  // ── Web · checkout ────────────────────────────────────────────────────
  [/^apps\/web\/app\/checkout\//, '05'],

  // ── Web · paneles ─────────────────────────────────────────────────────
  [/^apps\/web\/app\/\(panels\)\/panel\/promoter\//, '06'],
  [/^apps\/web\/app\/\(panels\)\/panel\/validator\//, '05'],
  [/^apps\/web\/app\/\(panels\)\/panel\/admin\/events\//, '04'],
  [/^apps\/web\/app\/\(panels\)\/panel\/admin\/checkin\//, '05'],
  [/^apps\/web\/app\/\(panels\)\/panel\/admin\/promoters\//, '06'],
  [/^apps\/web\/app\/\(panels\)\/panel\/admin\/(company|locals)\//, '03'],
  [/^apps\/web\/app\/\(panels\)\/panel\/superadmin\/(companies|affiliations)\//, '03'],
  [/^apps\/web\/app\/\(panels\)\/panel\/superadmin\/(taxonomy|reviews|reclamaciones)\//, '02'],

  // ── Web · cliente tipado por dominio ──────────────────────────────────
  [/^apps\/web\/lib\/api\/(catalog|trust|favorites)\.ts$/, '02'],
  [/^apps\/web\/lib\/api\/(companies|local-images|uploads)\.ts$/, '03'],
  [/^apps\/web\/lib\/api\/(orders|tickets)\.ts$/, '05'],
  [/^apps\/web\/lib\/api\/promoters\.ts$/, '06'],
  [/^apps\/web\/lib\/api\/(admin|ops)\.ts$/, null],

  // ── Modelo de datos y contratos ───────────────────────────────────────
  [/^packages\/db\/src\/schema\/identity\.ts$/, '01'],
  [/^packages\/db\/src\/schema\/(catalog|trust)\.ts$/, '02'],
  [/^packages\/db\/src\/schema\/companies\.ts$/, '03'],
  [/^packages\/db\/src\/schema\/events\.ts$/, '04'],
  [/^packages\/db\/src\/schema\/(checkout|outbox)\.ts$/, '05'],
  [/^packages\/db\/src\/schema\/promoters\.ts$/, '06'],
  [/^packages\/db\/src\/schema\/ops\.ts$/, null],
  [/^packages\/contracts\/src\/identity\//, '01'],
  [/^packages\/contracts\/src\/(catalog|trust)\//, '02'],
  [/^packages\/contracts\/src\/(companies|uploads)\//, '03'],
  [/^packages\/contracts\/src\/events\//, '04'],
  [/^packages\/contracts\/src\/checkout\//, '05'],
  [/^packages\/contracts\/src\/promoters\//, '06'],
  [/^packages\/contracts\/src\/(ops|common)\//, null],
];

/**
 * Pasa una ruta absoluta o relativa a ruta POSIX relativa a la raíz del repo,
 * en minúsculas. Windows entrega `A:\...\apps\api\...`; el mapa razona en
 * `apps/api/...`.
 */
export function normalizar(ruta, raiz) {
  if (!ruta) return null;
  const p = String(ruta).replace(/\\/g, '/');
  const r = String(raiz).replace(/\\/g, '/').replace(/\/+$/, '');
  const rel = p.toLowerCase().startsWith(`${r.toLowerCase()}/`) ? p.slice(r.length + 1) : p;
  return rel.replace(/^\.\//, '').toLowerCase();
}

/** Si la ruta ES uno de los documentos de la serie, devuelve su nombre. */
export function esDocumentoDiagrama(rutaRelativa) {
  if (!rutaRelativa) return null;
  const prefijo = `${DIR_DIAGRAMAS}/`;
  if (!rutaRelativa.startsWith(prefijo)) return null;
  const nombre = rutaRelativa.slice(prefijo.length);
  return Object.values(DOCUMENTOS).includes(nombre) ? nombre : null;
}

/**
 * Documento que debe revisarse tras tocar `rutaRelativa`.
 * Devuelve el nombre del .md, o null si el cambio no afecta a la serie.
 */
export function resolverDocumento(rutaRelativa) {
  if (!rutaRelativa) return null;
  if (IGNORADOS.some((re) => re.test(rutaRelativa))) return null;
  for (const [patron, dominio] of REGLAS) {
    if (patron.test(rutaRelativa)) return dominio === null ? null : DOCUMENTOS[dominio];
  }
  return null;
}
