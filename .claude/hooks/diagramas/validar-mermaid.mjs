#!/usr/bin/env node
// Hook PostToolUse · Write|Edit|MultiEdit
//
// Cuando el archivo escrito es un documento de la serie, pasa la fase 1 de
// check-diagramas.sh: las tres faltas que impiden compilar Mermaid (`;`, `<`
// sin escapar, `=>`). Es awk, sin red y sin modelo — milisegundos.
//
// Si hay hallazgos devuelve `decision: block`, así el error vuelve al modelo
// en el acto y no dos commits después. La fase 2 (render real con mermaid-cli)
// necesita red y se queda fuera del hook: la ejecuta la skill.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { leerEntrada, RAIZ } from './estado.mjs';
import { esDocumentoDiagrama, normalizar } from './mapa-dominios.mjs';

const SCRIPT = '.claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh';

const entrada = await leerEntrada();
const ruta = normalizar(
  entrada?.tool_input?.file_path ?? entrada?.tool_response?.filePath,
  RAIZ,
);
if (!ruta || !esDocumentoDiagrama(ruta)) process.exit(0);
if (!existsSync(join(RAIZ, SCRIPT))) process.exit(0);

const resultado = spawnSync('bash', [SCRIPT, '--solo-sintaxis', ruta], {
  cwd: RAIZ,
  encoding: 'utf8',
});

// bash ausente o script no ejecutable: el hook no es el guardián último, la
// skill vuelve a validar. No se interrumpe por eso.
if (resultado.error || resultado.status === null || resultado.status === 0) process.exit(0);

const salida = `${resultado.stdout ?? ''}${resultado.stderr ?? ''}`.trim();
process.stdout.write(
  JSON.stringify({
    decision: 'block',
    reason: `El diagrama editado no compila en Mermaid. Hallazgos de sintaxis en ${ruta}:

${salida}

Corrígelos antes de seguir. Recordatorio de la notación (§3.6): dentro de un bloque mermaid no puede haber \`;\`, ni \`<\` sin escapar, ni flechas de función \`=>\`. Los placeholders van entre llaves — {recursoId}, no <recursoId> — y los saltos de línea en notas se escriben <br/>.`,
    systemMessage: `Mermaid: sintaxis inválida en ${ruta}`,
  }),
);
process.exit(0);
