# Spec backend — Operación real de discotecas (validación de negocio 2026-07)

> Para: Wilson (backend). De: equipo frontend (Piero + Claude).
> Origen: entrevista con un insider que opera con varias discotecas de Lima
> (ARMONY, CATA, Noise, Georgia). El frontend ya implementa estas features en
> modo demo (mocks en `apps/web/lib/mock/`, rama `feat/negocio-validado`); este
> doc define lo que falta en API/DB para hacerlas reales. Shapes de los mocks =
> payloads propuestos (camelCase), para que la migración sea 1:1.

## 1. Contexto y alcance

Prácticas reales que el sistema debe cubrir para venderse a la mayoría de locales:

1. **Link self-serve de promotor** (patrón "Georgia"): el promotor comparte SU link; el invitado saca su propio código de entrada vía formulario. Hoy el flujo está invertido (el promotor genera códigos uno a uno con `generate-my-code`).
2. **Paloteo**: ingreso en puerta "vengo de parte de X promotor", sin código; el staff lo registra atribuido al promotor (así funcionan ARMONY y Noise).
3. **Reservas con split**: adelanto 50% o 100%; del monto pagado, ~90% es crédito de consumo canjeable y ~10% comisión (o 100% consumo, según local). Box de N pax entrega N pases de zona a nombre del comprador.
4. **Zonas custom por local**: General/VIP/SUPER VIP/JUNGLE/ENVY/BOX PRESIDENCIAL — nombres y cantidad los define cada local. La `zone` actual de catalog es una taxonomía global de distritos: NO sirve para esto.
5. **Metas de promotor**: además del % por venta de box/mesa, bonos por meta (20-25 ingresos en una fecha → S/ 100 + botella; 40 acumulados al mes → bono extra). Recompensas en efectivo Y en especie.
6. **Reingreso**: por defecto NO se permite; excepción configurable (pulsera). El ticket actual es single-use estricto.
7. **Política por local**: TODAS las reglas anteriores varían por local → aggregate de configuración con defaults (un local chico no configura nada y funciona).

Reclamo #1 del rubro que el sistema debe eliminar: **"pagué mi box y no aparece en la lista"** — la reserva y sus pases deben ser verificables en puerta sin depender de un Excel.

## 2. Tablas propuestas (convenciones §2.3: uuid PK `helpers.id()`, `helpers.timestamps()`, varchar+CHECK, snake_case singular)

```
venue_policy            1–1 con local
  local_id              uuid FK local, UNIQUE
  advance_pct           int  CHECK (advance_pct IN (50, 100))        default 100
  consumption_split_pct int  CHECK (0 <= x <= 100)                   default 90   -- comisión = 100 − x
  reentry_allowed       boolean                                      default false
  walk_in_enabled       boolean                                      default true -- paloteo
  promoter_code_quota   int                                          default 30   -- por evento

venue_zone              zonas/ambientes del local (NO confundir con catalog.zone)
  local_id              uuid FK local
  name                  varchar(80)      -- libre: "SUPER VIP", "JUNGLE", "DJ Boot"
  sort_order            int
  color                 varchar(16)      -- token/hex para el badge
  is_active             boolean
  UNIQUE (local_id, name)

promoter_goal_rule      reglas de metas por local
  local_id              uuid FK local
  kind                  varchar CHECK (kind IN ('per_event','monthly'))
  threshold             int              -- N ingresos
  reward_kind           varchar CHECK (reward_kind IN ('cash','in_kind'))
  reward_amount         numeric(10,2)    -- 0 si in_kind
  reward_detail         varchar(160)     -- "1 botella", "4 drinks"
  is_active             boolean

guest_code              código emitido por el INVITADO vía link del promotor
  code                  varchar(16) UNIQUE  -- INV-XXXXXX, aleatorio no enumerable
  referral_link_id      uuid FK referral_link
  event_id              uuid FK event
  zone_id               uuid FK venue_zone
  guest_name            varchar(120)
  status                varchar CHECK (status IN ('issued','used','expired'))
  used_at               timestamptz NULL

walk_in_attribution     paloteo
  local_id              uuid FK local
  event_id              uuid FK event NULL
  promoter_id           uuid FK promoter
  guest_name            varchar(120) NULL
  zone_id               uuid FK venue_zone NULL
  registered_by         uuid FK "user"      -- staff que registró (auditable)

reservation             reserva de mesa/box (hoy NO existe: el wizard es demo)
  local_id              uuid FK local
  event_id              uuid FK event NULL
  zone_id               uuid FK venue_zone
  table_code            varchar(40)         -- "Box 4 · SUPER VIP"
  holder_name           varchar(120)        -- a nombre de quién
  party_size            int
  total_amount          numeric(10,2)
  advance_paid          numeric(10,2)       -- según venue_policy.advance_pct
  consumption_credit    numeric(10,2)       -- total * split / 100
  commission_amount     numeric(10,2)       -- total − consumption_credit
  promoter_id           uuid FK promoter NULL  -- atribución de la venta (comisión 10%)
  status                varchar CHECK (status IN ('pending','confirmed','cancelled','fulfilled'))

reservation_pass        N pases por reserva (las "pulseras digitales")
  reservation_id        uuid FK reservation
  code                  varchar(16) UNIQUE  -- PAS-XXXXXX
  zone_id               uuid FK venue_zone
  idx                   int                 -- "Pase 3 de 15"
  status                varchar CHECK (status IN ('active','used'))

consumption_credit      wallet de consumo de la reserva (canjeable en carta)
  reservation_id        uuid FK reservation UNIQUE
  local_id              uuid FK local
  initial_amount        numeric(10,2)
  balance               numeric(10,2)       -- nunca < 0
```

Cambio adicional: `qr_validation` necesita `direction varchar CHECK ('in','out')` (hoy solo entrada) para soportar reingreso cuando `reentry_allowed = true`.

## 3. Endpoints propuestos (payloads = shapes de `apps/web/lib/mock/*.ts`)

| Endpoint | Notas |
|---|---|
| `GET/PUT /locals/:id/policy` | admin_local; PUT valida CHECKs; crea con defaults si no existe |
| `GET/POST/PATCH/DELETE /locals/:id/zones` | CRUD de venue_zone |
| `GET/POST/PATCH /locals/:id/promoter-goal-rules` | reglas de metas |
| `POST /r/:code/guest-codes` | **PÚBLICO** (rate-limited); body `{ guestName, eventId, zoneId? }`; valida cupo (`promoter_code_quota`) y link activo; devuelve guest_code |
| `GET /promoters/me/guest-codes?eventId=` | contador emitidos/usados para el panel promotor |
| `POST /checkins/walk-in` | staff (rol por definir con Wilson); requiere `walk_in_enabled`; crea walk_in_attribution |
| `POST /locals/:id/reservations` | **el desglose lo calcula el server** desde venue_policy (nunca confiar en el cliente); crea N reservation_pass = party_size EN LA MISMA TRANSACCIÓN + consumption_credit |
| `GET /reservations/:id/passes` | pases con QR para el comprador |
| `GET /locals/:slug/consumption-credit` | saldo del usuario en ese local (para la carta) |

## 4. Invariantes (no negociables)

- **Multi-tenant**: todo scoped con `tenantScopeOf(actor)` / `assertTenant` (edge). `venue_zone.local_id` debe pertenecer al company del actor; un pase/reserva/crédito jamás cruza de local.
- Split: `consumption_credit + commission_amount = total_amount` **calculado server-side** desde la policy vigente al momento de crear la reserva (snapshot en la fila, no join en caliente — la policy puede cambiar después).
- `reservation_pass`: exactamente `party_size` filas, en la misma transacción que la reserva. Si falla una, no existe ninguna (elimina el "pagué y no aparezco").
- `guest_code`: aleatorio no enumerable; `POST /r/:code/guest-codes` con rate limit agresivo (público) y cupo por promotor/evento enforced server-side.
- Paloteo: requiere `walk_in_enabled` + rol staff + `registered_by` (auditoría — el insider reportó robos de pulseras; todo movimiento de puerta queda firmado).
- Crédito: `balance` nunca negativo; canjeable solo en el local emisor; el descuento se aplica al confirmar pedido de carta (módulo de pedidos futuro).
- Reingreso: scan `out` + scan `in` posterior solo válidos si `reentry_allowed`; si no, segundo `in` → rechazo con motivo claro para puerta.

## 5. Migración mock → endpoint

| Mock (apps/web/lib/mock/) | Endpoint |
|---|---|
| `politica.ts` → `leerPoliticaDemo/guardarPoliticaDemo` | `GET/PUT /locals/:id/policy` (+zones +goal-rules) |
| `invitados.ts` → `emitirCodigoInvitadoDemo` | `POST /r/:code/guest-codes` |
| `paloteo.ts` → `registrarPaloteoDemo` | `POST /checkins/walk-in` |
| `reservas.ts` → `calcularDesgloseDemo/emitirPasesDemo` | `POST /locals/:id/reservations` |
| `credito.ts` → `leerCreditoDemo/consumirCreditoDemo` | `GET /locals/:slug/consumption-credit` |

## 6. Fuera de alcance (por ahora)

- Pasarela de pagos real del adelanto (el flujo demo no cobra).
- Liquidación automática de comisiones/bonos (se calcula y muestra; el pago es manual).
- App validator offline (scaffold aparte; estos endpoints deben ser cacheables para su modo offline — lista de códigos/pases del evento descargable).
- Módulo de pedidos de carta en backend (el crédito se especifica aquí porque la reserva lo emite, pero el canje real llega con ese módulo).
