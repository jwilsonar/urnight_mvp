#!/usr/bin/env node
// Hook PostToolUse · Write|Edit|MultiEdit|NotebookEdit
//
// Anota qué documento de docs/diagramas-secuencia/ queda tocado por el
// archivo recién escrito. No llama al modelo, no imprime nada, no bloquea:
// solo mantiene la cola que el hook Stop leerá al cerrar el turno.
//
// Al revés también: si el archivo escrito ES un documento de la serie, se
// saca de la cola — ya está sincronizado. Ese es el mecanismo que corta el
// ciclo de avisos.

import { leerEntrada, leerCola, escribirCola, RAIZ } from './estado.mjs';
import { esDocumentoDiagrama, normalizar, resolverDocumento } from './mapa-dominios.mjs';

const MAX_FUENTES = 8; // el aviso cita ejemplos, no el changelog entero

const entrada = await leerEntrada();
const bruta = entrada?.tool_input?.file_path ?? entrada?.tool_response?.filePath;
const ruta = normalizar(bruta, RAIZ);
if (!ruta) process.exit(0);

const sesion = entrada.session_id;
const cola = leerCola(sesion);

const documentoEditado = esDocumentoDiagrama(ruta);
if (documentoEditado) {
  if (cola.pendientes[documentoEditado]) {
    delete cola.pendientes[documentoEditado];
    escribirCola(sesion, cola);
  }
  process.exit(0);
}

const documento = resolverDocumento(ruta);
if (!documento) process.exit(0);

const entradaCola = cola.pendientes[documento] ?? { fuentes: [], avisado: false };
if (!entradaCola.fuentes.includes(ruta) && entradaCola.fuentes.length < MAX_FUENTES) {
  entradaCola.fuentes.push(ruta);
}
// Un cambio nuevo reabre el aviso aunque ya se hubiera dado antes.
entradaCola.avisado = false;
cola.pendientes[documento] = entradaCola;

escribirCola(sesion, cola);
process.exit(0);
