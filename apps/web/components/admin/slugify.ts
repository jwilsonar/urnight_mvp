/**
 * Deriva un slug kebab-case a partir de un nombre. Coincide con el regex que
 * imponen los esquemas (`/^[a-z0-9-]+$/`): minúsculas, sin acentos ni símbolos.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}
