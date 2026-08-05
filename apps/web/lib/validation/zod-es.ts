/**
 * Mensajes de validación de Zod en español.
 *
 * El source of truth (`@urnight/contracts`) define las REGLAS pero deja los
 * mensajes por defecto de Zod, que son en inglés ("String must contain at
 * least 8 character(s)"). En vez de duplicar los schemas en el web solo para
 * traducirlos, instalamos un errorMap global: traduce los defaults sin tocar
 * contracts. Los mensajes custom que sí trae el schema siguen ganando.
 *
 * Importar este módulo por su efecto secundario en un boundary de cliente
 * (formularios de auth) hace que `z.setErrorMap` corra antes de validar.
 *
 * Nota: i18n completo por locale del navegador es trabajo aparte (necesita
 * infra de traducciones); el idioma primario del producto es español (§docs).
 */
import { z, type ZodErrorMap } from 'zod';

/**
 * Mapa exportado para pasarlo POR-PARSE a `zodResolver(schema, { errorMap })`.
 * Es la vía fiable: el schema de `@urnight/contracts` se define con la instancia
 * de Zod del paquete, y un `setErrorMap` global del web no siempre alcanza esa
 * instancia (bundling). El errorMap contextual del parse sí aplica a todos los
 * issues sin mensaje propio, cruce de instancias incluido.
 */
export const zodErrorMapEs: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Este campo es obligatorio.' };
      }
      return { message: 'Valor inválido.' };

    case z.ZodIssueCode.too_small: {
      const min = issue.minimum as number;
      if (issue.type === 'string') {
        return min <= 1
          ? { message: 'Este campo es obligatorio.' }
          : { message: `Mínimo ${min} caracteres.` };
      }
      if (issue.type === 'number') return { message: `Debe ser ${min} o más.` };
      if (issue.type === 'array') return { message: `Selecciona al menos ${min}.` };
      return { message: 'Valor demasiado corto.' };
    }

    case z.ZodIssueCode.too_big: {
      const max = issue.maximum as number;
      if (issue.type === 'string') return { message: `Máximo ${max} caracteres.` };
      if (issue.type === 'number') return { message: `Debe ser ${max} o menos.` };
      return { message: 'Valor demasiado largo.' };
    }

    case z.ZodIssueCode.invalid_string: {
      if (issue.validation === 'email') return { message: 'Ingresa un correo válido.' };
      if (issue.validation === 'url') return { message: 'Ingresa una URL válida.' };
      return { message: 'Formato inválido.' };
    }

    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Elige una de las opciones.' };

    default:
      return { message: ctx.defaultError };
  }
};

// También global, por si alguna validación no pasa por el resolver.
z.setErrorMap(zodErrorMapEs);
