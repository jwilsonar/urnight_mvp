# ADR 0007 — Rebrand visual RAVENUE: paleta carmín/obsidiana reemplaza Royal Amethyst

- **Estado:** Aceptado
- **Fecha:** 2026-07-19
- **Contexto:** Rebrand visual RAVENUE y desviación temporal de `../der_class/PROJECT_SPECS.md` §DS

## Contexto

Las búsquedas de “UrNight” en Google no ofrecieron una asociación clara ni una
posición de marca defendible. Se adopta provisionalmente **RAVENUE**, unión de
**RAVE + VENUE**, para construir una identidad más distintiva y vinculada al
descubrimiento de eventos y locales.

El nombre sigue pendiente de validación ante INDECOPI y de comprobar la
disponibilidad de activos digitales. Por esa razón, esta decisión cubre el
rebrand visual, pero no autoriza todavía el rename global de “UrNight” ni de los
paquetes `@urnight/*`.

## Decisión

Se reemplaza Royal Amethyst por una paleta carmín/obsidiana:

- Obsidian Night `#09090D`.
- Midnight Carbon `#15151C`.
- Ravenue Crimson `#B21E45`.
- Deep Wine `#6E1833`.
- Moon White `#F4F0F2`.
- Smoke Gray `#A8A4AE`.
- Steel Border `#302E38`.
- Rose `#E8A2B8`, reservada para texto acentuado.

Se mantienen Sora + Inter. El wordmark provisional es **RA-VE-NUE**, con la V
intervenida como ícono; el logo definitivo queda pendiente.

La composición sigue la regla **70/20/10**: 70 % oscuros, 20 % blancos y grises
y 10 % carmín. Por accesibilidad, Ravenue Crimson queda prohibido como color de
texto sobre fondo oscuro porque su contraste es `2.9:1`; para texto acentuado se
usa Rose, con `9.3:1`. Moon White sobre Ravenue Crimson alcanza `6.6:1` y sí está
permitido.

## Consecuencias

- Los valores de color canónicos viven en tokens crudos `--rv-*`.
- Las utilidades y clases CSS adoptan nombres RAVENUE; se eliminan los aliases
  cromáticos y prefijos legacy.
- El rename global de “UrNight” y `@urnight/*` queda pendiente hasta validar el
  nombre y los activos digitales.
- La página `/brand` permanece como referencia viva del design system.
- La sección §DS de `PROJECT_SPECS.md` queda desactualizada hasta validar el
  nombre. Este ADR documenta la desviación exigida por las instrucciones del
  proyecto.
