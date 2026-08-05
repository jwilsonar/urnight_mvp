# Especificación del ranking de eventos en tendencia

`GET /events/trending` conserva su respuesta `EventResponse[]`. Solo participan
eventos publicados, futuros y visibles según `publishedConditions`; los
cancelados, pasados y sin disponibilidad quedan fuera.

## Score

Cada señal se normaliza entre 0 y 1 y el resultado se divide por la suma de los
pesos configurados:

```text
score = (velocidad * wV + cercanía * wC + intensidad * wI) / (wV + wC + wI)
```

- **Velocidad:** `ln(1 + ventas pagadas en la ventana) / ln(1 + máximo entre
candidatos)`. Las ventas salen de `order` y `order_item`, unidos por
  `ticket_type` al evento. El logaritmo amortigua la ventaja estructural de los
  locales grandes.
- **Cercanía:** `1 / (1 + días_hasta_inicio / 30)`. Vale 1 para un evento
  inmediato y 0.5 a 30 días, sin cortes bruscos.
- **Intensidad:** `sum(ticket_type.sold) / sum(ticket_type.stock)`, acotada a
  0..1. Así un aforo pequeño casi lleno compite con uno grande a medio llenar.

El cálculo, el orden y el `LIMIT` ocurren en una sola consulta de ranking. Los
empates se resuelven por `starts_at` ascendente y luego por `event.id`.

## Ajustes

Los cuatro ajustes se leen juntos desde `platform_setting`, se cachean 60
segundos por proceso y comparten la carga en curso. Si faltan, tienen tipo o
valor inválido, o el almacén falla, se usan los defaults sin romper el home.

| Clave                           | Default | Valor válido        |
| ------------------------------- | ------: | ------------------- |
| `trending.weight_velocity`      |     0.5 | número entre 0 y 1  |
| `trending.weight_proximity`     |     0.3 | número entre 0 y 1  |
| `trending.weight_intensity`     |     0.2 | número entre 0 y 1  |
| `trending.velocity_window_days` |       7 | entero entre 1 y 90 |

Una configuración con los tres pesos en cero restaura los pesos por defecto.

## Decisiones descartadas

- No se usa la venta acumulada ni los check-ins como criterio principal: ambos
  favorecen historia y tamaño, no demanda actual.
- No se ordena en memoria ni se introduce una tabla, vista materializada o
  migración para este lote.
- No se usan vistas de página porque hoy no se registran. Serían la cuarta señal
  natural cuando exista una medición confiable y resistente a abuso.
- No se usa un modelo opaco: las tres señales y sus pesos deben poder explicarse
  a cada local.
