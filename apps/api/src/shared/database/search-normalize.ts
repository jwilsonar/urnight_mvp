import { sql, type AnyColumn, type SQL } from 'drizzle-orm';

/**
 * Normalización para la búsqueda inteligente (#3). Iguala mayúsculas, acentos y
 * separadores para que "DJ Peligro", "dj peligro", "djpeligro", "dj" o "DJ"
 * apunten al mismo texto canónico. Estrategia: minúsculas → fold de acentos
 * (sin depender de la extensión `unaccent`) → quitar todo lo no alfanumérico.
 * Compartida por los adaptadores Drizzle de events y companies.
 */

/** Acentos/diacríticos frecuentes en español → base ASCII. Mismo mapeo en TS y SQL. */
const ACCENTED = 'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ';
const ASCII = 'aaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc';

/** Marcas diacríticas combinantes (NFD): U+0300–U+036F. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Normaliza el término de búsqueda en TS (lado de la query). */
export function normalizeSearch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '') // quita acentos descompuestos
    .replace(/[^a-z0-9]+/g, ''); // espacios, signos, etc.
}

/**
 * Expresión SQL que normaliza una columna con la MISMA lógica que
 * `normalizeSearch`: `regexp_replace(translate(lower(col), acentos, ascii), no-alnum, '')`.
 * Portátil (no requiere la extensión unaccent).
 */
export function normalizedColumn(col: AnyColumn | SQL): SQL {
  return sql`regexp_replace(translate(lower(${col}), ${ACCENTED}, ${ASCII}), '[^a-z0-9]+', '', 'g')`;
}
