---
name: sincronizar-diagramas-secuencia
description: Usar al cambiar código que aparece en docs/diagramas-secuencia/ — casos de uso, endpoints, guards, adapters, colas, esquema de datos o rutas de web/worker/validator — para actualizar el diagrama de secuencia del dominio afectado. También al crear un flujo nuevo que deba documentarse, o cuando el hook Stop avise de diagramas desactualizados.
---

# Sincronizar diagramas de secuencia

Mantiene `docs/diagramas-secuencia/` pegado al código. La serie documenta el
**AS-IS**: si un diagrama y el fuente discrepan, el equivocado es el diagrama.

## Cuándo entra esta skill

El hook `Stop` del proyecto la invoca solo cuando se tocó código de un dominio
con levantamiento y su `.md` sigue igual. También sirve a mano: «actualiza el
diagrama de checkout», «documenta este flujo nuevo».

## Cuándo NO editar

Antes de tocar nada, descarta. Un diagrama que cambia sin que el flujo cambie
es ruido en el diff y erosiona la confianza en la serie.

**No se edita** por: refactors internos que no mueven mensajes entre
participantes, tipos, tests, estilos, copy, i18n, renombrados de variables
locales, cambios de rendimiento sin efecto observable.

**Sí se edita** por: endpoint nuevo/renombrado/eliminado, cambio de método o
de código de estado, participante nuevo (adapter, cola, servicio), orden de
llamadas alterado, guard o validación añadida o quitada, transacción que pasa
a ser atómica o deja de serlo, evento de dominio nuevo, columna o tabla que
aparece en una nota del diagrama, caso de error nuevo en un bloque `alt`.

Si nada aplica: dilo en una frase, indica qué diagrama revisaste, y termina.

## Procedimiento

### 1. Acotar

De la lista que da el hook (o de la petición), quédate con **los diagramas
concretos**, no con el documento entero. Localízalos por su ID (`SD-07`) con
una búsqueda del nombre del caso de uso o del endpoint dentro del `.md`.

El mapa dominio↔documento vive en `.claude/hooks/diagramas/mapa-dominios.mjs`;
`docs/diagramas-secuencia/README.md` §2 lo explica en prosa.

### 2. Leer el código, no recordarlo

Abre el fuente que cambió y sigue el flujo real por las cuatro capas
hexagonales: `interfaces/http/` (ruta, guards, DTO) → `application/use-cases/`
(orquestación) → `domain/ports/` → `infrastructure/persistence/` (SQL real).
Anota método, ruta, código de estado y forma del payload de cada salto.

Los nombres se **copian tal cual del código**. Regla dura de la serie: un
`grep` del nombre en el repo tiene que encontrarlo.

### 3. Editar quirúrgicamente

Cambia las flechas afectadas y nada más. Conserva `autonumber`, los banners de
fase, las notas de invariante y las marcas `AS-IS`/`TO-BE` que ya estaban.

La notación completa está en [`references/notacion.md`](references/notacion.md)
— léela si vas a añadir participantes, bloques de control o notas. Lo que más
rompe compilación (§3.6):

- Nada de `;` dentro de un mensaje o nota.
- Nada de `<` sin escapar. Placeholders entre llaves: `{eventoId}`, no `<eventoId>`.
- Nada de flechas de función `=>`.
- Saltos de línea en notas con `<br/>`.

Si el flujo cambió tanto que el diagrama ya no lo describe, reescribe **ese**
diagrama entero antes que remendarlo. Si aparece un proceso nuevo, dale el
siguiente `SD-NN` libre del documento y añádelo al bloque temático que le toca.

### 4. Actualizar la trazabilidad

Cada documento cierra con una tabla **Trazabilidad** (proceso → endpoint →
código → estado) y una sección **Brechas y riesgos**. Toca la fila del proceso
que cambiaste. Si el cambio cierra una brecha listada, quítala; si abre una,
añádela.

Si el cambio altera el recuento de diagramas de un documento, actualiza también
las tablas §2 y §3 de `docs/diagramas-secuencia/README.md`.

### 5. Validar

Fase 1 — sintaxis, instantánea, sin red. Obligatoria:

```bash
bash .claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh \
  --solo-sintaxis docs/diagramas-secuencia/04-eventos-inventario.md
```

El hook `PostToolUse` ya la corre por ti tras cada edición de un documento de
la serie, pero pásala también antes de dar el trabajo por cerrado.

Fase 2 — render real con `@mermaid-js/mermaid-cli`. Necesita red y es la única
garantía de que compila (la fase 1 no ve, por ejemplo, un `alt` sin su `end`):

```bash
bash .claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh \
  docs/diagramas-secuencia/04-eventos-inventario.md
```

Códigos de salida: `0` bien · `1` sintaxis · `2` render · `3` uso incorrecto.

Los tests del validador: `bash .claude/skills/sincronizar-diagramas-secuencia/scripts/__tests__/run-tests.sh`.

### 6. Reportar

Cierra diciendo, en dos o tres líneas: qué diagramas cambiaste y por qué, cuáles
revisaste y dejaste igual, y si la fase 2 se ejecutó o no (y por qué no).

## Contexto del proyecto

- Fuente de verdad funcional: `../der_class/PROJECT_SPECS.md` (§N). Toda
  desviación se registra como ADR en `docs/adr/`.
- Numeración de documentos = dominios del DER §4.1; rango `9x` = transversal.
- El dominio 8 (Ops & Platform) todavía no tiene levantamiento: el mapa lo
  marca como `null` y el hook no avisa por él. Si lo documentas, crea
  `08-ops-plataforma.md`, regístralo en el README y añade la regla en el mapa.
