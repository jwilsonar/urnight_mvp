// Utilidades compartidas por los hooks de diagramas: leer la entrada del
// hook, localizar la raíz del repo y persistir la cola de documentos
// pendientes de sincronizar.
//
// La cola vive en `.claude/.estado-diagramas/<session_id>.json`, que git
// ignora (`.claude/*`). Es estado de sesión, no del proyecto.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo: .claude/hooks/diagramas/ → tres niveles arriba. */
export const RAIZ = process.env.CLAUDE_PROJECT_DIR
  ? resolve(process.env.CLAUDE_PROJECT_DIR)
  : resolve(AQUI, '..', '..', '..');

const DIR_ESTADO = join(RAIZ, '.claude', '.estado-diagramas');

/**
 * Lee el JSON que Claude Code envía por stdin. Un hook nunca debe romper la
 * sesión: si no hay entrada o no parsea, devuelve un objeto vacío y el
 * llamador termina en silencio.
 */
export async function leerEntrada() {
  try {
    if (process.stdin.isTTY) return {};
    let bruto = '';
    for await (const trozo of process.stdin) bruto += trozo;
    return bruto.trim() ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

function rutaEstado(sesion) {
  const id = String(sesion || 'sin-sesion').replace(/[^a-z0-9._-]/gi, '_');
  return join(DIR_ESTADO, `${id}.json`);
}

export function leerCola(sesion) {
  try {
    const ruta = rutaEstado(sesion);
    if (!existsSync(ruta)) return { pendientes: {} };
    const datos = JSON.parse(readFileSync(ruta, 'utf8'));
    return datos && typeof datos.pendientes === 'object' ? datos : { pendientes: {} };
  } catch {
    return { pendientes: {} };
  }
}

export function escribirCola(sesion, cola) {
  try {
    mkdirSync(DIR_ESTADO, { recursive: true });
    writeFileSync(rutaEstado(sesion), JSON.stringify(cola, null, 2), 'utf8');
  } catch {
    // Sin estado no hay aviso, pero tampoco se interrumpe el trabajo.
  }
}
