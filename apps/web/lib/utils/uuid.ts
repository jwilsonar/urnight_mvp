/** Validación de UUID v4 (canónica, case-insensitive). Centraliza la regex
 *  antes duplicada en selectores y formularios de operaciones. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
