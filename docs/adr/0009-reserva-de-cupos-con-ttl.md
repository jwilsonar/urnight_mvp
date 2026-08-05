# ADR 0009 — Reserva de cupos con TTL

**Estado:** Aceptado · **Fecha:** 2026-07-30

## Contexto

El checkout cobraba y emitía entradas en una sola llamada. La exclusión se
apoyaba en un lock Redis por evento y en el `CHECK sold <= stock`, pero el cupo
seguía visible mientras la persona llenaba asistentes y datos de pago. Además,
un lock de proceso o de una instancia no protege un despliegue horizontal.

La capacidad efectiva debe ser la misma para catálogo, ficha, selector de
entradas y confirmación:

`capacidad disponible = capacidad - vendidos - holds activos no vencidos`.

## Decisión

1. Persistir cada reserva temporal en `ticket_hold`, con estado `active`,
   `converted`, `expired` o `released` y TTL de diez minutos por defecto,
   configurable mediante `TICKET_HOLD_TTL_SECONDS`.
2. Crear o reemplazar el hold en una transacción que toma `FOR UPDATE` sobre
   `ticket_type`. Compradores del mismo tipo quedan serializados por Postgres.
3. Centralizar la fórmula y sus expresiones SQL en
   `packages/db/src/availability.ts`.
4. Ignorar siempre los holds vencidos en las lecturas. Un job repetible BullMQ
   del worker marca periódicamente esas filas como `expired`.
5. Convertir el hold dentro de la transacción que confirma la orden. La fila del
   hold se bloquea y una repetición para la misma orden es un no-op, por lo que
   un `OrderPaid` repetido no incrementa `sold` otra vez.
6. Mantener temporalmente checkout sin `holdId` para clientes antiguos. Ese
   camino también usa row lock y la disponibilidad centralizada, pero no reserva
   durante el llenado del formulario. El cliente web actual sí crea el hold al
   entrar y lo reemplaza al cambiar tipo o cantidad.

## Alternativas consideradas

- **Lock en memoria o semáforo del proceso.** Rechazado: no coordina réplicas de
  API y se pierde al reiniciar.
- **Cola serializada para todas las compras.** Rechazada: introduce latencia y
  un cuello de botella global; la contención real es por `ticket_type`.
- **Reserva optimista con reintento.** Rechazada como mecanismo principal:
  bajo alta demanda varios usuarios pueden avanzar o pagar antes de descubrir
  el conflicto.
- **Lock Redis de inventario.** Se conserva solo para idempotencia de requests.
  Postgres es la autoridad del cupo y permite verificar disponibilidad e insertar
  el hold en la misma transacción.

## Consecuencias

- `ticket_hold` requiere índices por evento, tipo, vencimiento y estado, además
  de limpieza periódica.
- El worker registra un job scheduler idempotente. Si el worker cae, la
  disponibilidad sigue siendo correcta porque toda lectura descarta
  `expires_at <= now()`; solo se retrasa la normalización del estado de las filas.
- Deben monitorearse holds activos/vencidos, latencia del job de limpieza,
  conflictos por capacidad y tiempo de espera de los row locks.
- La expiración no borra filas: conserva trazabilidad. Una política posterior
  de retención podrá archivar filas terminales sin afectar la fórmula.
