/**
 * Comisión por defecto del promotor (snapshot al atribuir una venta, §4.3 / ADR
 * 0003). Punto ÚNICO de la política (antes hardcodeada en `attribute-sale`).
 *
 * TODO(#M19): mover a `PLATFORM_SETTING` (el módulo `ops` expone
 * `PlatformSettingRepository`). Hasta entonces se centraliza aquí y se admite
 * override por env para no fijar la tasa en el binario.
 */
export const PROMOTER_COMMISSION_RATE = Number(process.env.PROMOTER_COMMISSION_RATE ?? 0.05);
