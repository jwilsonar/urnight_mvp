import { z } from 'zod';

/** Edad mínima legal del MVP (§4.3 — solo mayores de 18). */
export const MIN_AGE = 18;

/** Calcula la edad en años a partir de una fecha de nacimiento. */
export function ageFrom(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

/**
 * Fecha de nacimiento válida solo si la persona es mayor de 18 (§4.3).
 * Reutilizable en registro (web/móvil) y checkout (API) — un solo esquema.
 */
export const adultBirthDateSchema = z
  .string()
  .date()
  .refine((value) => ageFrom(new Date(value)) >= MIN_AGE, {
    message: `Debe ser mayor de ${MIN_AGE} años`,
  });

/**
 * Número de documento genérico: 8–20 alfanumérico. Se mantiene para los sitios
 * que aún no conocen el tipo; cuando el tipo está disponible hay que usar
 * `documentNumberSchemaFor`, que valida el largo real de cada documento.
 */
export const documentNumberSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^[A-Za-z0-9]+$/, 'Documento inválido');

export const DOCUMENT_TYPES = ['dni', 'ce', 'passport'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentRule {
  digitsOnly: boolean;
  minLength: number;
  maxLength: number;
}

/**
 * Largo y alfabeto de cada documento aceptado en Perú.
 *
 * `digitsOnly` importa doble: además de rechazar letras, obliga a tratar el
 * número como texto y NUNCA como number — hay DNI que empiezan en cero
 * (04483215) y convertirlos a número se los come.
 */
export const DOCUMENT_RULES = {
  dni: { digitsOnly: true, minLength: 8, maxLength: 8 },
  ce: { digitsOnly: true, minLength: 9, maxLength: 12 },
  passport: { digitsOnly: false, minLength: 6, maxLength: 12 },
} as const satisfies Record<DocumentType, DocumentRule>;

export function documentRuleFor(type: DocumentType): DocumentRule {
  return DOCUMENT_RULES[type];
}

/** ¿El número corresponde al formato de ese tipo de documento? */
export function isValidDocumentNumber(type: DocumentType, value: string): boolean {
  const rule = DOCUMENT_RULES[type];
  const trimmed = value.trim();
  if (trimmed.length < rule.minLength || trimmed.length > rule.maxLength) return false;
  return rule.digitsOnly ? /^\d+$/.test(trimmed) : /^[A-Za-z0-9]+$/.test(trimmed);
}

/** Esquema de número de documento acotado al tipo. */
export function documentNumberSchemaFor(type: DocumentType) {
  const rule = DOCUMENT_RULES[type];
  const unidad = rule.digitsOnly ? 'dígitos' : 'caracteres';
  return z
    .string()
    .trim()
    .refine((value) => isValidDocumentNumber(type, value), {
      message:
        rule.minLength === rule.maxLength
          ? `Debe tener ${rule.minLength} ${unidad}`
          : `Debe tener entre ${rule.minLength} y ${rule.maxLength} ${unidad}`,
    });
}

/** Nombre y apellido: al menos dos palabras de dos letras o más. */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .refine((value) => value.split(/\s+/).filter((part) => part.length >= 2).length >= 2, {
    message: 'Ingresa nombre y apellido',
  });

/** Celular peruano: nueve dígitos que empiezan en 9. */
export const PERU_MOBILE_LENGTH = 9;
export const peruMobileSchema = z
  .string()
  .trim()
  .regex(/^9\d{8}$/, 'Ingresa un celular de 9 dígitos que empiece en 9');

/**
 * RUC: once dígitos exactos. No se restringe el prefijo a propósito — hoy SUNAT
 * solo emite 10/15/17/20, pero amarrar la validación a esa lista es pedir un
 * bug el día que agreguen otro.
 */
export const RUC_LENGTH = 11;
export const rucSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos');
