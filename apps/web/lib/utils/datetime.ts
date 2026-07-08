/** Conversión entre ISO 8601 y el valor de `<input type="datetime-local">` (hora local). */

/** ISO → valor para `<input type="datetime-local">` (YYYY-MM-DDTHH:mm en local). */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 16);
}

/** Valor de `datetime-local` → ISO 8601, o undefined si está vacío/inválido. */
export function localInputToIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
