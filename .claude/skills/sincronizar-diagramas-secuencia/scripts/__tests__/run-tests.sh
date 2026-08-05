#!/usr/bin/env bash
# Tests de check-diagramas.sh. Solo fase 1: la fase 2 necesita red.
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$AQUI/../check-diagramas.sh"
FIX="$AQUI/fixtures"
FALLOS=0

fallo() { echo "  FALLO: $1"; FALLOS=$((FALLOS + 1)); }

esperar_codigo() {
  local nombre="$1" esperado="$2" archivo="$3"
  local salida codigo
  salida="$("$SCRIPT" --solo-sintaxis "$FIX/$archivo" 2>&1)"
  codigo=$?
  if [ "$codigo" -ne "$esperado" ]; then
    fallo "$nombre: esperaba codigo $esperado, obtuvo $codigo"
    echo "$salida" | sed 's/^/    /'
  else
    echo "  ok: $nombre"
  fi
}

esperar_contiene() {
  local nombre="$1" patron="$2" archivo="$3"
  local salida
  salida="$("$SCRIPT" --solo-sintaxis "$FIX/$archivo" 2>&1)"
  if echo "$salida" | grep -q -- "$patron"; then
    echo "  ok: $nombre"
  else
    fallo "$nombre: la salida no contiene '$patron'"
    echo "$salida" | sed 's/^/    /'
  fi
}

# El resumen de un documento sin diagramas debe ser UNA sola linea. Cubre el
# bug de contar_diagramas, donde `grep -c || echo 0` la duplicaba.
esperar_resumen_una_linea() {
  local nombre="$1" archivo="$2"
  local n
  n="$("$SCRIPT" --solo-sintaxis "$FIX/$archivo" 2>&1 | grep -c 'diagrama(s)')"
  if [ "$n" -eq 1 ]; then
    echo "  ok: $nombre"
  else
    fallo "$nombre: esperaba 1 linea de resumen, obtuvo $n"
  fi
}

echo "Tests de check-diagramas.sh (fase 1)"
esperar_codigo   "fixture limpia pasa"             0 ok.md
esperar_codigo   "punto y coma falla"              1 punto-y-coma.md
esperar_codigo   "menor-que falla"                 1 menor-que.md
esperar_codigo   "flecha de funcion falla"         1 flecha-funcion.md
esperar_codigo   "entidades HTML no dan falso positivo" 0 entidad-html.md
esperar_codigo   "documento sin mermaid pasa"      0 sin-mermaid.md
esperar_contiene "el hallazgo de ';' nombra la regla"  "[;]"  punto-y-coma.md
esperar_contiene "el hallazgo de '<' nombra la regla"  "[<]"  menor-que.md
esperar_contiene "el hallazgo de '=>' nombra la regla" "[=>]" flecha-funcion.md
esperar_contiene "el hallazgo lleva numero de linea"   ":7:"  punto-y-coma.md
esperar_resumen_una_linea "el resumen sin diagramas es una linea" sin-mermaid.md

echo
if [ "$FALLOS" -eq 0 ]; then
  echo "Todos los tests pasaron."
  exit 0
fi
echo "$FALLOS test(s) fallaron."
exit 1
