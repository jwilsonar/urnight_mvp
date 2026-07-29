#!/usr/bin/env bash
# Verifica los bloques Mermaid de un documento de docs/diagramas-secuencia/.
#
#   Fase 1  sintaxis  : busca los errores que impiden compilar. Instantaneo.
#   Fase 2  render    : npx @mermaid-js/mermaid-cli@11. Necesita red.
#
# Uso: check-diagramas.sh [--solo-sintaxis] <doc.md> [<doc.md>...]
#
# Codigos de salida:
#   0  todo bien
#   1  hallazgos de sintaxis en fase 1
#   2  fallo de render en fase 2
#   3  argumento invalido o archivo inexistente
set -uo pipefail

SOLO_SINTAXIS=0
if [ "${1:-}" = "--solo-sintaxis" ]; then
  SOLO_SINTAXIS=1
  shift
fi

if [ "$#" -eq 0 ]; then
  echo "uso: check-diagramas.sh [--solo-sintaxis] <doc.md> [<doc.md>...]" >&2
  exit 3
fi

for archivo in "$@"; do
  if [ ! -f "$archivo" ]; then
    echo "no existe: $archivo" >&2
    exit 3
  fi
done

# --- Fase 1 -----------------------------------------------------------------
# Recorre solo las lineas dentro de bloques ```mermaid y aplica tres reglas.
# El numero de linea es absoluto en el archivo, para poder saltar ahi.
escanear() {
  awk -v ARCHIVO="$1" '
    /^[[:space:]]*```mermaid[[:space:]]*$/ { dentro = 1; next }
    dentro && /^[[:space:]]*```[[:space:]]*$/ { dentro = 0; next }
    !dentro { next }
    {
      linea = $0

      # Regla ";": las entidades HTML (&lt; &#60;) llevan ; legitimo, se quitan antes.
      sonda = linea
      gsub(/&[A-Za-z]+;/, "", sonda)
      gsub(/&#[0-9]+;/, "", sonda)
      if (index(sonda, ";") > 0)
        printf "%s:%d: [;] punto y coma en bloque mermaid: %s\n", ARCHIVO, NR, linea

      # Regla "<": solo importa < seguido de letra o barra. <br/> es legitimo.
      sonda2 = linea
      gsub(/<br\/?>/, "", sonda2)
      if (sonda2 ~ /<[A-Za-z\/]/)
        printf "%s:%d: [<] menor-que sin escapar: %s\n", ARCHIVO, NR, linea

      # Regla "=>": flecha de funcion de JavaScript.
      if (index(linea, "=>") > 0)
        printf "%s:%d: [=>] flecha de funcion: %s\n", ARCHIVO, NR, linea
    }
  ' "$1"
}

contar_diagramas() {
  # grep -c sin coincidencias imprime 0 Y sale con codigo 1: hay que
  # capturar la salida y normalizar el codigo, no encadenar con ||.
  local n
  n="$(grep -c '^[[:space:]]*```mermaid[[:space:]]*$' "$1" 2>/dev/null)" || n=0
  echo "$n"
}

hallazgos_totales=0
for archivo in "$@"; do
  n="$(contar_diagramas "$archivo")"
  hallazgos="$(escanear "$archivo")"
  if [ -n "$hallazgos" ]; then
    n_hallazgos="$(printf '%s\n' "$hallazgos" | wc -l | tr -d ' ')"
    echo "$hallazgos"
  else
    n_hallazgos=0
  fi
  hallazgos_totales=$((hallazgos_totales + n_hallazgos))
  echo "fase 1: $archivo — $n diagrama(s), $n_hallazgos hallazgo(s)"
done

if [ "$hallazgos_totales" -gt 0 ]; then
  echo "fase 1 FALLA: $hallazgos_totales hallazgo(s) de sintaxis." >&2
  exit 1
fi

if [ "$SOLO_SINTAXIS" -eq 1 ]; then
  exit 0
fi

# --- Fase 2 -----------------------------------------------------------------
# Render real. Es la unica garantia de que compila: la fase 1 no detecta,
# por ejemplo, un bloque alt sin su end.
TEMPORAL="$(mktemp -d)"
trap 'rm -rf "$TEMPORAL"' EXIT

fallos_render=0
for archivo in "$@"; do
  esperados="$(contar_diagramas "$archivo")"
  if [ "$esperados" -eq 0 ]; then
    echo "fase 2: $archivo — sin diagramas, se omite"
    continue
  fi

  salida="$(npx -y @mermaid-js/mermaid-cli@11 -i "$archivo" -o "$TEMPORAL/$(basename "$archivo")" 2>&1)"
  codigo=$?
  # Solo los SVG cuentan: con salida .md, mmdc genera ademas un markdown
  # compuesto que tambien imprime su marca de exito e inflaria el conteo.
  renderizados="$(echo "$salida" | grep -c '✅.*\.svg')"

  if [ "$codigo" -ne 0 ] || [ "$renderizados" -lt "$esperados" ]; then
    echo "fase 2 FALLA: $archivo — $renderizados/$esperados renderizados" >&2
    echo "$salida" | sed 's/^/    /' >&2
    fallos_render=$((fallos_render + 1))
  else
    echo "fase 2: $archivo — $renderizados/$esperados renderizados"
  fi
done

if [ "$fallos_render" -gt 0 ]; then
  exit 2
fi

exit 0
