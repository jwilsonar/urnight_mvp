/** Formato de fechas y precios del catálogo (es-PE, moneda PEN §2.3). */

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "vie 12 sep · 22:00" a partir de un ISO 8601. */
export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
}

/** "S/ 80" — precio entero, "S/ 80.50" si trae decimales. */
export function formatPrice(amount: number, currency = 'PEN'): string {
  const symbol = currency === 'PEN' ? 'S/' : currency;
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol} ${value}`;
}

/** Precio mínimo de una lista de tramos activos; null si no hay. */
export function minActivePrice(
  tickets: { price: number; status: string }[],
): number | null {
  const active = tickets.filter((t) => t.status !== 'paused');
  if (active.length === 0) return null;
  return Math.min(...active.map((t) => t.price));
}
