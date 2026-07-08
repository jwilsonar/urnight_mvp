/** Formateadores localizados es-PE / moneda PEN. */

const penFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

/** Formatea un monto en Soles peruanos: 1234.5 → "S/ 1,234.50". */
export function formatPEN(value: number): string {
  return penFormatter.format(value);
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Fecha + hora localizada (ISO string o Date). */
export function formatDate(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === 'string' ? new Date(value) : value);
}

const dateFormatter = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' });

/** Solo fecha localizada (ISO string o Date). */
export function formatDateOnly(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value);
}

/**
 * Clave de comparación de etiquetas libres (case/acentos-insensible) para
 * deduplicar: minúsculas + NFD sin marcas diacríticas (U+0300..U+036F).
 */
export function tagKey(value: string): string {
  return [...value.trim().toLowerCase().normalize('NFD')]
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
}
