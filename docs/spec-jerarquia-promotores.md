# Jerarquía de promotores y comisión en cascada

## Qué se modeló

`promoter.parent_promoter_id` representa al cabeza de equipo. La relación es opcional y usa
`ON DELETE SET NULL`; los cupos existentes en `promoter_ticket_allocation` no cambian.

El admin puede asignar o retirar un cabeza con `PATCH /promoters/{id}/parent`. El ranking conserva
`totals` como métricas propias y añade `ownSales`, `teamMemberCount` y `teamSales` como campos
opcionales. Las ventas del equipo nunca se mezclan en una cifra sin etiqueta ni cambian el orden
histórico del ranking.

## Invariantes

`AssignPromoterParentUseCase` aplica las reglas antes de persistir:

- padre e hijo pertenecen a la misma empresa, usando `assertTenant`;
- un promotor no puede ser su propio ancestro, ni directa ni indirectamente;
- el MVP permite solo cabeza → promotor: un cabeza con equipo no puede depender de otro y un
  promotor que ya depende de un cabeza no puede tener equipo.

Los errores tienen códigos propios en `PROMOTERS_ERROR_CODES`. El repositorio y el ranking siguen
filtrando con el scope multi-tenant compartido; incluso una relación histórica inválida de otra
empresa queda fuera del agregado.

## Configuración y cálculo de cascada

`promoter_local_policy` guarda una política por local:

- `cascade_enabled`: `false` por defecto;
- `cascade_percentage`: `0` por defecto, con rango de 0 a 100 en contrato y base de datos.

Se consulta y actualiza con `GET/PUT /promoters/locals/{localId}/cascade-policy`. Si el local no
tiene una fila, la API responde la política segura `false/0`.

Al atribuir una venta nueva, el porcentaje se convierte a tasa 0–1 y se guarda en
`sale_attribution` junto con el cabeza y el monto. Las atribuciones anteriores conservan esos campos
en `NULL`, por lo que encender la opción no recalcula ni altera liquidaciones históricas. La comisión
del vendedor se calcula igual que antes; la del cabeza es un costo adicional del local y no se resta
al vendedor. Solo se genera el monto adicional si el cabeza sigue activo al atribuir la venta.

## Pendiente de confirmar con el contacto

Falta confirmar si los cabezas realmente cobran sobre las ventas de su equipo y, de ser así, si ese
monto lo asume el local o sale de la comisión del promotor vendedor. Por esa incertidumbre la opción
queda apagada por defecto. El modelo actual sigue la hipótesis de costo adicional del local; cambiar
la regla de reparto requerirá modificar el cálculo de la atribución, sin reescribir snapshots
históricos.
