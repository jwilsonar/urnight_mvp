import { createLogger } from '@/lib/logger';

const log = createLogger('csp');

/**
 * Receptor de violaciones CSP (`report-uri` de next.config). Solo registra el
 * reporte para poder pasar la política de Report-Only a enforce con evidencia;
 * responde 204 siempre (los browsers no esperan cuerpo).
 */
export async function POST(req: Request): Promise<Response> {
  const report: unknown = await req.json().catch(() => null);
  log.warn({ report }, 'web.security.csp_violation');
  return new Response(null, { status: 204 });
}
