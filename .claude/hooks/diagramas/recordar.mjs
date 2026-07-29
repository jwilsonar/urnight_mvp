#!/usr/bin/env node
// Hook Stop · cierre de turno
//
// Si el turno tocó código de un dominio y su diagrama sigue igual, no deja
// cerrar: devuelve `decision: block` con la lista exacta de documentos y de
// archivos que los desactualizan.
//
// Tres cortacircuitos, porque un Stop hook que bloquea siempre es un bucle:
//   1. `stop_hook_active` — ya venimos de un bloqueo, no se encadena otro.
//   2. `avisado` — cada conjunto de pendientes bloquea UNA vez. Si el modelo
//      argumenta que no hay nada que cambiar, el turno cierra.
//   3. detectar.mjs saca el documento de la cola en cuanto se edita, así que
//      el camino normal (sincronizar) desbloquea solo.

import { leerCola, escribirCola, leerEntrada } from './estado.mjs';
import { DIR_DIAGRAMAS } from './mapa-dominios.mjs';

const entrada = await leerEntrada();
if (entrada.stop_hook_active === true) process.exit(0);

const sesion = entrada.session_id;
const cola = leerCola(sesion);

const pendientes = Object.entries(cola.pendientes ?? {})
  .filter(([, v]) => v?.avisado !== true)
  .sort(([a], [b]) => a.localeCompare(b));

if (pendientes.length === 0) process.exit(0);

for (const [doc] of pendientes) cola.pendientes[doc].avisado = true;
escribirCola(sesion, cola);

const listado = pendientes
  .map(([doc, { fuentes = [] }]) => {
    const cambios = fuentes.map((f) => `    - ${f}`).join('\n');
    return `- ${DIR_DIAGRAMAS}/${doc}\n  cambios que lo desactualizan:\n${cambios}`;
  })
  .join('\n');

const razon = `Este turno modificó código de dominios con diagrama de secuencia levantado, y esos documentos siguen sin tocar:

${listado}

Invoca la skill \`sincronizar-diagramas-secuencia\` y aplícala SOLO a los documentos listados.

Reglas de la sincronización:
- Toca únicamente los diagramas afectados por esos cambios concretos. No reescribas documentos completos ni "mejores" diagramas que nadie tocó.
- Los nombres de casos de uso, endpoints, guards y columnas se copian tal cual del código: un grep del nombre debe encontrarlo.
- Actualiza también la fila correspondiente de la tabla de Trazabilidad del documento.
- Si el cambio no altera ningún flujo documentado (refactor interno, tipos, copy, estilos), NO edites el diagrama: dilo en una frase, indica qué revisaste, y cierra el turno.`;

process.stdout.write(
  JSON.stringify({
    decision: 'block',
    reason: razon,
    systemMessage: `Diagramas de secuencia por revisar: ${pendientes.map(([d]) => d).join(', ')}`,
  }),
);
process.exit(0);
