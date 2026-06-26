import { randomInt } from 'node:crypto';

/** Alfabeto Crockford sin caracteres ambiguos (0,1,O,I,L,U). */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LEN = 6;

/**
 * Código legible para promociones: 6 caracteres del alfabeto sin ambigüedades,
 * fácil de teclear (ej. `7F3K9X`). Se muestra agrupado `7F3-K9X` en el front;
 * se persiste sin guion y en mayúsculas.
 */
export function generateReadableCode(): string {
  let out = '';
  for (let i = 0; i < LEN; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
