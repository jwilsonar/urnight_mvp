# ADR 0002 — Locals dentro de Companies y desviaciones del MVP

**Estado:** Aceptado · **Fecha:** 2026-06-21

## Contexto

`PROJECT_SPECS.md` §2.2 lista 8 bounded contexts e incluye **Locals** como módulo
propio (`apps/api/src/modules/locals/`). Durante la implementación, el dominio de
locales quedó **dentro del módulo `companies`** (COMPANY ──< LOCAL comparten
aggregate root multi-tenant y repos), y el esqueleto vacío `modules/locals/`
quedó sin uso.

Además, la auditoría del MVP detectó elementos en el código no listados en el
board ni en SPECS.

## Decisión

1. **Locals vive en el módulo `companies`.** El bounded context "Companies &
   Locals" (§4.1 dominio 3) se realiza como un solo módulo hexagonal. Se elimina
   el esqueleto muerto `apps/api/src/modules/locals/`.
2. **`PILOT_FEEDBACK`** (tabla en `packages/db/src/schema/ops.ts`) se mantiene
   como instrumentación del piloto; no es feature de producto. Queda fuera del
   alcance funcional del board y documentada aquí.
3. **Pagos** permanecen sobre `MockPaymentAdapter` (SPECS §1.5): fuera del MVP.

## Consecuencias

- `companies` agrupa COMPANY, LOCAL, LOCAL_VERIFICATION, AFFILIATION_REQUEST,
  imágenes y junctions. La separación futura a un módulo `locals` propio sigue
  siendo de bajo coste (los puertos ya aíslan la persistencia).
- El mapa C4 ↔ código (SPECS §7) debe leerse con esta equivalencia:
  `Component Locals` → `modules/companies`.
- `PILOT_FEEDBACK` no se expone en la API de producto.
