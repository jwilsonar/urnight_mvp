# ADR 0005 — Naming de constraints CHECK (sufijo `_check` en vez de prefijo `ck_`)

**Estado:** Aceptado · **Fecha:** 2026-07-02 · **Decisores:** Equipo UrNight

## Contexto

`PROJECT_SPECS.md` §2.3 fija para los constraints CHECK el patrón
`ck_<tabla>_<regla>` (ej. `ck_user_favorite_target`). El schema Drizzle de
`packages/db` usa en cambio el sufijo `<tabla>_<regla>_check` (ej.
`user_favorite_target_one_of_check`, `ticket_type_sold_check`), que es el nombre
que **Drizzle genera por defecto** cuando se declara `check('nombre', sql\`...\`)`
y coincide con la convención implícita de PostgreSQL (`<tabla>_<col>_check`).

Las ~40 CHECKs ya están creadas y aplicadas en las migraciones 0000–0009. La
auditoría 2026-07-02 lo registró como hallazgo **B6** (cosmético).

## Decisión

Se **acepta la desviación**: los CHECK conservan el sufijo `_check`. No se
renombran.

Motivos:

1. **Coste/riesgo desproporcionado.** Renombrar constraints exige una migración
   disruptiva (`ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ...` por cada
   CHECK, con recomputación de la validación en tablas con datos) a cambio de
   cero valor funcional.
2. **Cosmético.** El nombre del constraint no afecta comportamiento, consultas ni
   contratos; sólo aparece en mensajes de error de PG.
3. **Consistencia con la herramienta.** El sufijo `_check` es lo que Drizzle y PG
   emiten por defecto; mantenerlo evita divergencia entre lo declarado y lo
   generado, y fricción en futuras migraciones autogeneradas.

## Consecuencias

- (+) Sin migración disruptiva ni riesgo sobre datos existentes.
- (+) Las migraciones futuras de Drizzle siguen siendo predecibles.
- (−) Divergencia documentada respecto a SPECS §2.3. Si en algún momento se hace
  una migración de reescritura amplia, puede aprovecharse para alinear el naming.
- `PROJECT_SPECS.md §2.3` debería anotar esta convención efectiva (`_check`) o
  referenciar este ADR.
