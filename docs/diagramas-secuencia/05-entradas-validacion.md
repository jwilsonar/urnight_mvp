# Entradas y validación — Diagramas de secuencia y flujo de protocolo

**Serie:** [Diagramas de secuencia](./README.md) · **Dominio 5 del DER** — *Checkout, Payments & Tickets* (§4.1 de `PROJECT_SPECS.md`)

> **Alcance.** Cuatro procesos del dominio *Entradas y validación*, agrupados en cinco bloques y
> representados con **13 diagramas de secuencia Mermaid** en formato *protocol data flow*: cada flecha
> lleva su método, ruta, código de estado y forma del payload; cada fase del pipeline va marcada con un
> banner. Reflejan el código real de `apps/api` (módulos `ticketing` y `promoters`), `apps/worker`
> (outbox relay + procesador de notificaciones), `apps/web` (checkout y billetera) y `apps/validator`
> (app de puerta con cola offline).
>
> Mismo estándar de notación que `docs/diagramas-secuencia/01-identidad-acceso.md`.
> Fecha de levantamiento: 2026-07-28 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Proceso cubierto |
|---|---|---|
| SD-A | [Barreras anti-sobreventa y anti-doble-cobro](#sd-a--barreras-anti-sobreventa-y-anti-doble-cobro) | sub-flujo compartido |
| SD-B | [Outbox, relay y worker](#sd-b--outbox-relay-y-worker) | sub-flujo compartido |
| SD-01 | [Acceso al checkout y precondiciones](#sd-01--acceso-al-checkout-y-precondiciones) | Compra estándar |
| SD-02 | [Compra estándar: checkout y pago](#sd-02--compra-estándar-checkout-y-pago) | Compra estándar |
| SD-03 | [Idempotencia y reintento seguro](#sd-03--idempotencia-y-reintento-seguro) | Compra estándar |
| SD-04 | [Generación del código single-use](#sd-04--generación-del-código-single-use) | Código promocional |
| SD-05 | [Enlace corto y resolución del código](#sd-05--enlace-corto-y-resolución-del-código) | Canje |
| SD-06 | [Canje: descuento y entrada gratuita](#sd-06--canje-descuento-y-entrada-gratuita) | Entrada gratuita |
| SD-07 | [Emisión del QR y su imagen](#sd-07--emisión-del-qr-y-su-imagen) | Generación de entradas |
| SD-08 | [Entrega asíncrona: PDF y notificaciones](#sd-08--entrega-asíncrona-pdf-y-notificaciones) | Entrega de entradas |
| SD-09 | [Consulta: billetera y detalle de orden](#sd-09--consulta-billetera-y-detalle-de-orden) | Consulta de entradas |
| SD-10 | [Validación QR online en puerta](#sd-10--validación-qr-online-en-puerta) | Validación QR online |
| SD-11 | [Cola offline y sincronización](#sd-11--cola-offline-y-sincronización) | Cola offline |

---

## 2. Agrupación de los procesos

Los cuatro procesos son un solo recorrido: se compra, se emite, se entrega, se consulta y se quema en
puerta. Dos mecanismos transversales aparecen en casi todos los diagramas y se extraen primero: las
**barreras de concurrencia** del checkout y la **cadena de entrega asíncrona** por outbox.

| Bloque | Procesos | Razón de la agrupación |
|---|---|---|
| **0 · Sub-flujos compartidos** | — | Las barreras anti-sobreventa (SD-A) gobiernan compra estándar y canje por igual. La cadena outbox → relay → worker (SD-B) entrega tanto entradas como correos de identidad. |
| **1 · Compra estándar** | Compra estándar de entradas | Se parte en tres: precondiciones de acceso, transacción de compra, y el mecanismo de idempotencia, que tiene su propia máquina de estados. |
| **2 · Códigos promocionales** | Código promocional, canje y entrada gratuita | Recorrido completo del código: lo genera el promotor (SD-04), lo comparte por enlace corto (SD-05) y se canjea en el checkout (SD-06). La entrada gratuita no es un flujo aparte: es un descuento del 100 %. |
| **3 · Generación, entrega y consulta** | Generación, entrega y consulta de entradas | Tres momentos distintos: el token del QR nace síncrono en la Tx, la imagen y el PDF llegan asíncronos, y la billetera los lee después. |
| **4 · Validación** | Validación QR online y cola offline | El veredicto de puerta es una máquina de cuatro estados con marca atómica. La cola offline es la degradación de ese mismo flujo cuando no hay red. |

---

## 3. Convenciones de notación

Estándar de la serie. La fuente canónica es `.claude/skills/sincronizar-diagramas-secuencia/references/notacion.md`.

### 3.1 Estructura

1. **`autonumber` siempre.** Permite referenciar un paso concreto en revisiones ("falla en el paso 7").
2. **Un diagrama = un caso de uso.** Si un flujo supera ~40 mensajes o los 8 participantes, se parte y
   se referencia con una nota (`note over X: ver SD-A`).
3. **Máximo 8 participantes.** Por encima, el diagrama deja de leerse en pantalla.
4. **Declaración explícita de participantes al inicio**, en orden de aparición izquierda → derecha
   (usuario → cliente → borde → aplicación → dominio → infraestructura). Nunca declarar por primera
   vez a mitad del diagrama: el orden visual se desordena.
5. **`actor` para personas, `participant` para sistemas.** Alias corto en mayúsculas (`UC`, `DB`),
   etiqueta legible con `as`.

### 3.2 Flujo de protocolo

Regla central de este documento: **el diagrama debe poder contrastarse contra el tráfico real.**

6. **Toda petición lleva su respuesta.** Ninguna flecha `->>` de red se queda sin su `-->>` con código
   de estado y forma del payload. Si no hay respuesta, es un `-)` (asíncrono) y se dice por qué.
7. **Anotación de protocolo en la ida:** `MÉTODO /ruta · cabecera o cuerpo relevante`.
   Ejemplo: `GET /api/v1/{recurso}/{id} · Authorization Bearer {accessToken}`.
8. **Anotación de resultado en la vuelta:** `código · payload`.
   Ejemplo: `409 · problem+json { code: {contexto}/{error} }`.
9. **Infraestructura con su comando real**, no con una paráfrasis: `UPDATE ticket SET status = 'used' WHERE status = 'valid'`,
   `SET NX EX 86400`, `INSERT OR IGNORE`. Hace el diagrama auditable
   contra los adapters Drizzle y Redis.
10. **Placeholders entre llaves**, nunca entre `<` `>` (Mermaid los interpreta como HTML): `{orderId}`.

### 3.3 Fases

11. **Banners de fase** con `note over A, B: Fase N · Nombre (componente real)`, abarcando los
    participantes implicados en ese tramo. Convierten un muro de flechas en un flujo legible por
    etapas y hacen explícito qué componente gobierna cada una.
12. **Notas de invariante** (`note over X:`) reservadas para reglas de seguridad, decisiones de diseño
    y brechas conocidas. Nunca para narrar lo que la flecha ya dice.
13. Saltos de línea en notas con `<br/>` para no ensanchar el diagrama.

### 3.4 Arrows y bloques de control

| Notación | Significado |
|---|---|
| `->>` | Llamada síncrona: el emisor espera respuesta |
| `-->>` | Respuesta o retorno, con código de estado |
| `-)` | Asíncrono fire-and-forget: publicación de evento, encolado |
| `X->>X` | Cómputo interno que cambia estado o toma una decisión (hash, firma, validación) |

| Bloque | Uso |
|---|---|
| `alt` / `else` | Caminos mutuamente excluyentes (éxito vs. error de negocio) |
| `opt` | Tramo que puede no ejecutarse y no tiene alternativa |
| `critical` | Transacción atómica (`UnitOfWork`): si algo falla, nada se persiste |
| `par` / `and` | Señales concurrentes e independientes |
| `loop` | Repetición acotada (reintentos, generación de código único) |

### 3.5 Cierre

14. **Cada diagrama termina en el efecto observable**: lo que ve el usuario, la cookie fijada o el
    documento devuelto. Un diagrama que acaba en una llamada interna está incompleto.

### 3.6 Higiene sintáctica

15. **Nada de `;` dentro de un mensaje o una nota.** Mermaid corta la sentencia ahí y el diagrama deja
    de compilar. Usar coma o punto.
16. Nada de `<` `>` sin escapar, incluidas las flechas de función de JavaScript (ver regla 10).
17. Los nombres de casos de uso, guards, endpoints y claves de Redis se copian **tal cual del código**:
    un `grep` del nombre debe encontrar el fuente.
18. **Los diagramas TO-BE nombran componentes que no existen todavía** y lo señalan en el propio participante o en una nota. Los AS-IS nombran archivos reales.

### 3.7 Validación

```bash
npx -y @mermaid-js/mermaid-cli@11 \
  -i docs/diagramas-secuencia/05-entradas-validacion.md \
  -o /tmp/05-entradas-validacion.md
```

También sirven mermaid.live y la extensión *Markdown Preview Mermaid Support* de VS Code. GitHub
renderiza estos bloques de forma nativa.

---

## 4. Catálogo de participantes

| Alias | Componente real | Archivo |
|---|---|---|
| `U` | Persona compradora, promotora o validadora | — |
| `CF` | `useCheckoutForm` — estado, reglas y submit del checkout | `apps/web/components/checkout/use-checkout-form.ts` |
| `PG` | Server Component de una ruta | `apps/web/app/**` |
| `EDGE` | Pipeline global del API: `RateLimit → Auth → Roles` + `ZodValidationPipe` | `apps/api/src/edge/**` |
| `UC` | Caso de uso (capa aplicación) | `apps/api/src/modules/**/application/use-cases/**` |
| `LOCK` | `LockPort` sobre Redis (`RedisLockAdapter`) | `apps/api/src/shared/locking/**` |
| `IDEM` | `RedisIdempotencyStore` | `.../ticketing/infrastructure/persistence/redis-idempotency.store.ts` |
| `INV` | `InventoryPort` — stock de tipos de entrada y contadores del evento | `.../ticketing/domain/ports/inventory.repository.ts` |
| `PAY` | `PaymentPort` → `MockPaymentAdapter` | `.../ticketing/infrastructure/payment/mock-payment.adapter.ts` |
| `PROMO` | `PromoRedemptionPort` → `PromoRedemptionService` (implementado por Promoters) | `apps/api/src/shared/ports/promo-redemption.port.ts` |
| `BUS` | `EventBus` in-process | `apps/api/src/shared/event-bus/event-bus.ts` |
| `OBX` | `OutboxPort` → `DrizzleOutboxAdapter` (tabla `outbox`) | `apps/api/src/shared/outbox/drizzle-outbox.adapter.ts` |
| `RELAY` | `OutboxRelay` — drena la tabla y encola en BullMQ | `apps/worker/src/outbox/outbox-relay.service.ts` |
| `WK` | `NotificationsProcessor` — PDF, notificaciones y envío | `apps/worker/src/processors/notifications.processor.ts` |
| `ST` | `StoragePort` — S3 compatible | `apps/api/src/shared/adapters/storage/**` |
| `VAL` | App de puerta (Expo) | `apps/validator/**` |
| `SQL` | SQLite local del validador | `apps/validator/lib/offline-cache.ts` |
| `DB` | PostgreSQL vía Drizzle | `packages/db/src/schema/**` |

---

## 5. Bloque 0 · Sub-flujos compartidos

### SD-A · Barreras anti-sobreventa y anti-doble-cobro

Cinco barreras encadenadas protegen el inventario. Ninguna sustituye a las otras: la primera reduce
la contención, la última es la garantía dura.

```mermaid
sequenceDiagram
    autonumber
    participant UC as CheckoutUseCase
    participant IDEM as Redis · idempotencia
    participant LOCK as Redis · lock distribuido
    participant HOLD as ConvertTicketHoldUseCase
    participant INV as InventoryPort
    participant PAY as PaymentPort
    participant DB as PostgreSQL

    note over UC, IDEM: Barrera 1 · Dedupe por Idempotency-Key (M3, opcional)
    opt la petición trae Idempotency-Key
        UC->>IDEM: GET idempotency:checkout:{userId}:{key}
        IDEM-->>UC: orderId ya asociado, o null
        note over UC, IDEM: Si existe, se reproduce la orden y NO se vuelve a cobrar → SD-03
    end

    note over UC, INV: Barrera 2 · Pre-validación fail-fast, fuera de la Tx
    UC->>INV: getEvent(eventId) y getTicketType(ticketTypeId) por línea
    INV-->>UC: evento y tipos con stock, sold, available, status y maxPerUser
    UC->>UC: evento a la venta, tipo activo, cantidad dentro de maxPerUser
    note over UC, INV: available viene de availableCapacity: stock menos sold<br/>menos los holds activos no vencidos (ADR 0009).

    note over UC, HOLD: Barrera 3 · Reserva con TTL creada al entrar al checkout
    alt la línea trae holdId
        UC->>HOLD: validateForCheckout({ holdId, ticketTypeId, qty, userId })
        HOLD-->>UC: hold activo y no vencido, o HoldExpiredError
        note over UC, HOLD: El cupo ya estaba reservado mientras la persona<br/>llenaba asistentes y pago, así que no se ofrecía a otros.
    else compra antigua sin holdId
        UC->>UC: available menor que qty entonces TicketTypeUnavailableError
    end
    note over UC: Corta pronto los casos obvios sin tomar el lock ni abrir Tx,<br/>y toma el snapshot de precios de la orden.

    note over UC, LOCK: Barrera 4 · Lock distribuido por evento
    UC->>LOCK: withLock(event:{eventId}, TTL 10 s)
    alt lock no disponible
        LOCK-->>UC: LockUnavailableError
        UC-->>UC: StockLockedError · 409 checkout/stock_locked
        note over UC, LOCK: Se pide reintento en vez de arriesgar sobreventa.
    else lock adquirido
        LOCK-->>UC: sección crítica

        note over UC, DB: Barrera 5 · Re-verificación dentro de la Tx y CHECK en la base
        critical BEGIN — commit total o rollback total
            UC->>INV: getTicketType(ticketTypeId, tx) — relectura CON la conexión transaccional
            INV-->>UC: stock y sold frescos
            note over UC, INV: M2: leer con `tx` y no con el pool. Leer del pool dentro de una Tx<br/>abierta puede ver un estado anterior y dejar pasar sobreventa.
            opt la línea trae holdId
                UC->>HOLD: executeInTransaction({ holdId, orderId }, tx)
                HOLD->>DB: findByIdForUpdate(holdId, tx) — SELECT ... FOR UPDATE
                DB-->>HOLD: fila de ticket_hold bloqueada
                HOLD->>DB: UPDATE ticket_hold SET status = 'converted'
                note over HOLD, DB: Conversión idempotente: si el hold ya estaba converted<br/>para esta misma orden, no consume cupo dos veces.
            end
            UC->>DB: UPDATE ticket_type SET sold = sold + qty
            note over DB: CHECK sold menor o igual que stock. Si se viola, la Tx aborta:<br/>garantía dura, independiente de locks y de la aplicación.
            UC->>PAY: charge({ orderId, amount, currency, method })
            alt pago rechazado
                PAY-->>UC: { approved false, failureReason }
                UC-->>UC: PaymentRejectedError · 402 checkout/payment_rejected
                note over UC, DB: ROLLBACK: el stock reservado se libera automáticamente.
            else pago aprobado
                PAY-->>UC: { approved true, reference }
                UC->>DB: INSERT de order, payment, tickets y attendees
                DB-->>UC: COMMIT
            end
        end
    end
```

### SD-B · Outbox, relay y worker

Cadena de entrega asíncrona. La usa el checkout (`send-order-tickets`) y también Identidad
(`send-verification-email`, `send-welcome-email`).

```mermaid
sequenceDiagram
    autonumber
    participant UC as Caso de uso (API)
    participant OBX as DrizzleOutboxAdapter
    participant DB as PostgreSQL · tabla outbox
    participant RELAY as OutboxRelay (worker)
    participant Q as BullMQ · cola notifications
    participant WK as NotificationsProcessor

    note over UC, DB: Fase 1 · Encolado dentro de la MISMA transacción (§3.2)
    critical Tx del caso de uso
        UC->>OBX: enqueue({ queue notifications, name, data }, tx)
        OBX->>DB: INSERT INTO outbox (queue, name, payload) con status pending
    end
    DB-->>UC: COMMIT
    note over UC, DB: El job se persiste con el dato de negocio. Si el proceso cae justo<br/>después del commit, el trabajo no se pierde: sigue en la tabla.

    note over RELAY, Q: Fase 2 · Relay, poll de 2 s y lotes de 20
    loop cada 2 s
        RELAY->>DB: SELECT * FROM outbox WHERE status = 'pending' ORDER BY available_at LIMIT 20
        DB-->>RELAY: filas pendientes
        alt encolado correcto
            RELAY->>Q: queue.add(name, payload, { jobId: outbox.id })
            Q-->>RELAY: job aceptado
            RELAY->>DB: UPDATE outbox SET status = 'done', processed_at = now()
            note over RELAY, Q: jobId igual al id de la fila: reencolar la misma fila no duplica el job.
        else fallo de encolado
            Q-->>RELAY: error
            RELAY->>DB: UPDATE outbox SET attempts = attempts + 1, last_error = ...
            opt attempts alcanza OUTBOX_MAX_ATTEMPTS (10 por defecto)
                RELAY->>DB: UPDATE outbox SET status = 'failed'
                note over RELAY, DB: A4 · fila envenenada: sale del poll para no reintentar<br/>en bucle cada 2 s.
            end
        end
    end

    note over Q, WK: Fase 3 · Consumo y desenlace
    Q->>WK: process(job)
    WK->>WK: valida job.data con el esquema Zod del job
    alt payload inválido o nombre de job desconocido
        WK-->>Q: UnrecoverableError, sin reintentos
    else payload válido
        WK->>WK: despacha por job.name
        WK-->>Q: { ok true }
    end
    opt fallo terminal (reintentos agotados o irrecuperable)
        WK->>DB: UPDATE outbox SET status = 'failed', last_error, processed_at WHERE id = jobId
        note over WK, DB: A4 · el desenlace terminal queda en la fila para trazabilidad y DLQ.
    end
```

---

## 6. Bloque 1 · Compra estándar

### SD-01 · Acceso al checkout y precondiciones

Ruta `/checkout` (Server Component). Cuatro compuertas antes de mostrar el formulario.

```mermaid
sequenceDiagram
    autonumber
    actor U as Comprador
    participant PX as proxy.ts (edge)
    participant PG as Ruta /checkout (RSC)
    participant NA as Auth.js
    participant FET as lib/api catalog y promoters
    participant EDGE as Edge API

    note over U, NA: Fase 1 · Sesión con token utilizable
    U->>PX: GET /checkout?event={slug}&code={code}
    alt sin cookie de sesión
        PX-->>U: 307 → /login?callbackUrl={checkoutPath}
    else con cookie
        PX->>PG: next()
        PG->>NA: requireAccessToken(checkoutPath)
        note over PG, NA: requireAccessToken y no requireSession: si el refresh falló, se<br/>re-autentica ahora en vez de dejar llenar el formulario para que el POST dé 401.
        alt sin accessToken o con session.error
            NA-->>PG: sesión inutilizable
            PG-->>U: 307 → /login?callbackUrl={checkoutPath}
        else token vigente
            NA-->>PG: session con accessToken

            note over PG, U: Fase 2 · Onboarding completado
            alt onboardingCompleted es false
                PG-->>U: 307 → /onboarding?callbackUrl={checkoutPath}
            else onboarding hecho

                note over PG, EDGE: Fase 3 · Evento vendible y entradas cargadas
                PG->>FET: getEventBySlug(slug)
                FET->>EDGE: GET /api/v1/events/{slug}
                alt 404
                    EDGE-->>FET: 404 · { code events/event_not_found }
                    PG->>PG: notFound()
                else evento existe
                    EDGE-->>PG: 200 OK · EventResponse
                    alt status distinto de published
                        PG-->>U: aviso "el evento no está disponible"
                    else publicado
                        PG->>FET: getEventTicketTypes(event.id)
                        alt error al cargar entradas
                            FET-->>PG: throw
                            PG-->>U: alerta destructiva "no pudimos cargar las entradas"
                        else entradas cargadas
                            EDGE-->>PG: 200 OK · TicketTypeResponse[]

                            note over PG, EDGE: Fase 4 · Código de promotor en la URL
                            opt viene ?code=
                                PG->>FET: resolveRedemptionCode(code)
                                FET->>EDGE: GET del código público → SD-05
                                alt código válido
                                    EDGE-->>PG: ResolveRedemptionCodeResponse con isFree
                                else inválido o API caída
                                    PG->>PG: codeFailed = true
                                    PG-->>U: aviso "el código ya no es válido"
                                    note over PG: M12 · no se cae al checkout de pago en silencio<br/>como si nunca hubiera habido una entrada gratis.
                                end
                            end
                            PG-->>U: CheckoutClient con evento, entradas, presetCode y freeOffer
                        end
                    end
                end
            end
        end
    end
```

### SD-02 · Compra estándar: checkout y pago

`POST /api/v1/orders/checkout` · autenticado · `CheckoutUseCase`. Crear y pagar ocurren en un solo
paso dentro de una transacción.

```mermaid
sequenceDiagram
    autonumber
    actor U as Comprador
    participant CF as useCheckoutForm
    participant EDGE as Edge API
    participant UC as CheckoutUseCase
    participant LOCK as Redis · lock
    participant INV as InventoryPort
    participant PAY as PaymentPort
    participant DB as PostgreSQL

    note over U, EDGE: Fase 1 · Validación en cliente
    U->>CF: elige tipo de entrada y carga los asistentes
    CF->>CF: React Hook Form con Zod, mayoría de edad por asistente y tope por maxPerUser
    note over CF: "Soy yo" solo se ofrece si la cuenta trae documento y fecha de nacimiento.<br/>Las altas por Google no los tienen, así que no hay nada que reutilizar.
    CF->>EDGE: POST /api/v1/orders/checkout · Bearer · Idempotency-Key opcional
    EDGE->>EDGE: RateLimitGuard 10/min por IP y usuario, fail-closed → AuthGuard → Zod(createOrderSchema)
    EDGE->>UC: execute({ userId, dto, idempotencyKey })
    note over UC: Con Idempotency-Key el flujo se envuelve en el dedupe → SD-03

    note over UC, INV: Fase 2 · Pre-validación fail-fast y snapshot de precios
    UC->>INV: getEvent(eventId)
    INV-->>UC: evento con isOnSale
    alt evento no a la venta
        UC-->>EDGE: EventNotOnSaleError
        EDGE-->>CF: 409 · { code checkout/event_not_on_sale }
    else a la venta
        loop por cada línea del pedido
            UC->>INV: getTicketType(ticketTypeId)
            INV-->>UC: tipo con price, currency, stock, sold, status y maxPerUser
            UC->>UC: valida pertenencia al evento, estado activo, tope por usuario y stock
        end
        note over UC: Errores posibles: 404 ticket_type_not_found · 409 ticket_type_unavailable<br/>409 max_per_user_exceeded · 409 insufficient_stock

        note over UC, DB: Fase 3 · Descuento y sección crítica
        opt viene promoCode
            UC->>UC: PromoRedemptionPort.preview → descuento calculado → SD-06
        end
        UC->>LOCK: withLock(event:{eventId}, TTL 10 s)
        alt lock ocupado
            LOCK-->>UC: LockUnavailableError
            UC-->>EDGE: StockLockedError
            EDGE-->>CF: 409 · { code checkout/stock_locked }
        else lock adquirido
            UC->>UC: Order.create con items, commissionRate 0.1 y discountTotal
            note over UC: total = subtotal menos descuento. commissionAmount se calcula sobre<br/>el subtotal y NO se suma al total (ver brechas, §10).
            UC->>UC: Payment.initiate en estado pendiente

            critical Tx única (UnitOfWork)
                loop por cada línea
                    UC->>INV: getTicketType(ticketTypeId, tx) — relectura transaccional (M2)
                    UC->>DB: UPDATE ticket_type SET sold = sold + qty
                end
                UC->>DB: UPDATE event SET tickets_sold = tickets_sold + total
                UC->>PAY: charge({ orderId, amount, currency, method })
                alt rechazado
                    PAY-->>UC: { approved false, failureReason }
                    UC-->>EDGE: PaymentRejectedError
                    EDGE-->>CF: 402 · { code checkout/payment_rejected }
                    note over UC, DB: ROLLBACK completo: el stock reservado vuelve a estar libre.<br/>TODO conocido: el PAYMENT rechazado tampoco se persiste.
                else aprobado
                    PAY-->>UC: { approved true, reference }
                    UC->>DB: INSERT INTO "order" y payment aprobado
                    opt hubo promoCode
                        UC->>DB: INSERT de la redención e incremento de used_count
                    end
                    UC->>UC: emite un Ticket con token QR y un Attendee por asistente
                    note over UC: El token es randomBytes(24) en base64url, columna UNIQUE.<br/>Attendee.create vuelve a exigir 18+ en el dominio.
                    UC->>DB: INSERT masivo de tickets y attendees
                    UC->>DB: INSERT INTO outbox — job send-order-tickets → SD-B
                end
            end
            DB-->>UC: COMMIT

            note over UC, CF: Fase 4 · Eventos de dominio y respuesta
            UC-)DB: OrderPaidEvent — atribución al promotor si hay referralCode
            loop por cada entrada emitida
                UC-)DB: TicketIssuedEvent — genera la imagen del QR → SD-07
            end
            UC-->>EDGE: { order, tickets }
            EDGE-->>CF: 201 Created · { order OrderResponse, tickets TicketResponse[] }
            CF-->>U: pantalla de compra confirmada con las entradas y sus QR
        end
    end
```

### SD-03 · Idempotencia y reintento seguro

Cabecera `Idempotency-Key` en `POST /orders/checkout`. Evita el doble cobro cuando el cliente
reintenta por timeout o por doble clic.

```mermaid
sequenceDiagram
    autonumber
    participant CF as Cliente
    participant EDGE as Edge API
    participant UC as CheckoutUseCase
    participant IDEM as RedisIdempotencyStore
    participant LOCK as Redis · lock por clave
    participant DB as PostgreSQL

    note over CF, IDEM: Fase 1 · Consulta previa sin lock
    CF->>EDGE: POST /orders/checkout · Idempotency-Key {key}
    EDGE->>UC: execute({ userId, dto, idempotencyKey })
    UC->>IDEM: GET idempotency:checkout:{userId}:{key}
    IDEM-->>UC: orderId o null
    alt ya hay orden asociada
        note over UC, DB: Reproducción: se devuelve lo ya creado, sin cobrar de nuevo
        UC->>DB: SELECT de la orden por id
        alt la orden ya no existe
            DB-->>UC: null
            UC-->>EDGE: StockLockedError
            EDGE-->>CF: 409 · pedir reintento
        else existe
            DB-->>UC: order
            UC->>DB: SELECT de las entradas de esa orden
            DB-->>UC: tickets
            UC-->>EDGE: { order, tickets }
            EDGE-->>CF: 201 Created · misma respuesta que la primera vez
        end
    else sin registro previo

        note over UC, LOCK: Fase 2 · Sección crítica por clave de idempotencia
        UC->>LOCK: withLock(idempotency:checkout:{userId}:{key}, TTL 10 s)
        alt otra petición con la misma clave en vuelo
            LOCK-->>UC: LockUnavailableError
            UC-->>EDGE: StockLockedError
            EDGE-->>CF: 409 · { code checkout/stock_locked }
            note over UC, LOCK: Se prefiere pedir reintento antes que arriesgar el doble cobro.
        else lock adquirido
            UC->>IDEM: segunda consulta dentro del lock
            IDEM-->>UC: orderId o null
            note over UC, IDEM: Doble comprobación: otra petición pudo terminar entre la<br/>primera consulta y la adquisición del lock.
            alt apareció una orden
                UC-->>EDGE: reproducción, como arriba
            else sigue sin orden
                UC->>UC: ejecuta el checkout completo → SD-02
                UC->>IDEM: SET idempotency:checkout:{userId}:{key} {orderId} EX 86400 NX
                note over IDEM: NX y TTL de 24 h: la primera orden es la buena y cubre<br/>reintentos razonables del cliente.
                IDEM-->>UC: OK
                UC-->>EDGE: { order, tickets }
                EDGE-->>CF: 201 Created
            end
        end
    end
    note over UC, IDEM: Límite conocido (M3): el dedupe es best-effort sobre Redis.<br/>Sin Redis no hay garantía de exactamente-una-vez.
```

---

## 7. Bloque 2 · Código promocional, canje y entrada gratuita

### SD-04 · Generación del código single-use

`POST /api/v1/promoters/me/redemption-codes` · `@Roles('promoter')` · `GenerateRedemptionCodeUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor PR as Promotor
    participant PNL as Panel de promotor
    participant EDGE as Edge API
    participant UC as GenerateRedemptionCodeUseCase
    participant PE as PromoterEventRepository
    participant PC as PromoCodeRepository
    participant DB as PostgreSQL

    note over PR, UC: Fase 1 · Identidad y pertenencia de la asignación
    PR->>PNL: genera un código para un tipo de entrada
    PNL->>EDGE: POST /api/v1/promoters/me/redemption-codes · Bearer · { promoterEventId, ticketTypeId }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('promoter') → Zod(generateRedemptionCodeSchema)
    EDGE->>UC: execute({ userId, dto })
    UC->>DB: SELECT del promotor activo ligado a este usuario
    alt no es promotor activo
        DB-->>UC: null
        UC-->>EDGE: PromoterNotFoundError · 404
    else promotor activo
        UC->>PE: findHeader(promoterEventId)
        PE-->>UC: cabecera de la asignación o null
        alt asignación inexistente o inactiva
            UC-->>EDGE: PromoterEventNotFoundError · 404
        else asignación activa
            alt la asignación es de otro promotor
                UC-->>EDGE: AssignmentForbiddenError · 403
                note over UC: Nadie puede generar códigos sobre el cupo de otro promotor.
            else asignación propia

                note over UC, DB: Fase 2 · Consumo del cupo asignado
                UC->>PE: getAllocation(promoterEventId, ticketTypeId)
                PE-->>UC: cupo con remaining, discountType y discountValue
                alt sin cupo definido
                    UC-->>EDGE: AllocationNotFoundError · 404
                else cupo agotado
                    UC-->>EDGE: AllocationExhaustedError · 409
                else cupo disponible

                    note over UC, PC: Fase 3 · Código legible y único
                    loop hasta 6 intentos
                        UC->>UC: code = generateReadableCode()
                        UC->>PC: existsByCode(code)
                        PC-->>UC: true o false
                    end
                    note over UC: Si las 6 tentativas colisionan, se alarga el código<br/>en vez de fallar la operación.
                    UC->>PC: createGenerated con snapshot de discountType y discountValue
                    PC->>DB: INSERT INTO promo_code ligado al promotor y a la asignación
                    DB-->>PC: 1 row
                    note over UC, DB: El descuento se copia del cupo en el momento de crear:<br/>cambiar la asignación después no altera códigos ya emitidos.
                    UC-->>EDGE: RedemptionCodeView
                    EDGE-->>PNL: 201 Created · RedemptionCodeResponse
                    PNL-->>PR: código listo para compartir como /p/{code}
                end
            end
        end
    end
```

### SD-05 · Enlace corto y resolución del código

`GET /p/{code}` (Route Handler de Next) + `ResolveRedemptionCodeUseCase` (público).

```mermaid
sequenceDiagram
    autonumber
    actor U as Invitado
    participant RT as Route Handler /p/{code}
    participant FET as lib/api/promoters.ts
    participant EDGE as Edge API
    participant UC as ResolveRedemptionCodeUseCase
    participant DB as PostgreSQL

    note over U, EDGE: Fase 1 · Resolución del código
    U->>RT: GET /p/{code}
    RT->>FET: resolveRedemptionCode(code)
    FET->>EDGE: GET del código de canje, ruta pública
    EDGE->>UC: execute(code)
    UC->>DB: SELECT de la vista del código con promotor, evento y tipo de entrada
    alt código inexistente
        DB-->>UC: null
        UC-->>EDGE: { valid false, reason "Código no encontrado" }
    else código encontrado
        DB-->>UC: vista resuelta

        note over UC: Fase 2 · Evaluación del estado
        alt no está activo
            UC->>UC: status revoked
        else pasó validUntil
            UC->>UC: status expired
        else usedCount alcanzó la cuota
            UC->>UC: status redeemed
        else vigente
            UC->>UC: status active y valid true
        end
        UC->>UC: isFree cuando el descuento es porcentual y vale 100
        UC->>UC: savings acotado al precio del tipo de entrada
        UC-->>EDGE: ResolveRedemptionCodeResponse con promotor, evento, tipo, isFree y savings
    end
    EDGE-->>FET: 200 OK · ResolveRedemptionCodeResponse
    FET-->>RT: oferta resuelta

    note over RT, U: Fase 3 · Registro del clic y redirección
    RT-)EDGE: registerRedemptionClick(code) — best-effort, no bloquea
    note over RT, EDGE: El clic se dispara sin esperar respuesta: la métrica nunca<br/>debe retrasar ni romper la redirección del invitado.
    alt código válido y con evento
        RT-->>U: 307 → /checkout?event={slug}&code={code}
    else inválido, expirado o API caída
        RT-->>U: 307 → /events
    end
```

### SD-06 · Canje: descuento y entrada gratuita

`PromoRedemptionPort` — puerto público de Promoters consumido por Ticketing dentro del checkout.

```mermaid
sequenceDiagram
    autonumber
    participant UC as CheckoutUseCase
    participant PROMO as PromoRedemptionService
    participant PC as PromoCodeRepository
    participant DOM as Aggregate PromoCode
    participant PAY as PaymentPort
    participant DB as PostgreSQL

    note over UC, DOM: Fase 1 · Preview sin efectos, antes de cobrar
    UC->>PROMO: preview({ code, userId, eventId, subtotal, items })
    PROMO->>PC: findByCode(code)
    PC-->>PROMO: PromoCode o null
    alt código inexistente
        PROMO-->>UC: PromoCodeNotFoundError · 404
    else existe
        PROMO->>DOM: isValid({ subtotal, eventId, localId, items })
        DOM->>DOM: activo, dentro de vigencia, con cupo y con scope aplicable
        note over DOM: Scope event, local o ticket_type: el código debe casar con el<br/>evento, el local o estar entre las líneas del pedido.
        alt no aplica
            DOM-->>PROMO: { valid false, reason }
            PROMO-->>UC: PromoCodeInvalidError · 409 con el motivo
        else aplica
            PROMO->>PC: listRedemptionsByUser(userId)
            PC-->>PROMO: canjes previos del usuario
            alt ya canjeó este código
                PROMO-->>UC: PromoCodeAlreadyRedeemedError · 409
                note over PROMO, DB: M1 · corte temprano antes de cobrar. La barrera dura sigue<br/>siendo el UNIQUE (promo_code_id, user_id) del esquema.
            else primer canje
                PROMO->>DOM: computeDiscount(ctx)
                DOM->>DOM: base = línea del tipo si el scope es ticket_type, si no el subtotal
                DOM-->>PROMO: descuento redondeado y acotado a la base
                PROMO-->>UC: { promoCodeId, discount }

                note over UC, PAY: Fase 2 · Efecto sobre el total y el cobro
                UC->>UC: Order.create con discountTotal, total = subtotal menos descuento, mínimo 0
                alt descuento del 100 por ciento — entrada gratuita
                    note over UC, PAY: La entrada gratis no es un flujo aparte: es un total de 0<br/>que igualmente pasa por el PaymentPort.
                end
                UC->>PAY: charge({ amount: total })
                PAY-->>UC: aprobado

                note over PROMO, DB: Fase 3 · Registro del canje en la MISMA Tx del checkout
                critical Tx del checkout
                    UC->>PROMO: redeem({ promoCodeId, orderId, userId, discount }, tx)
                    PROMO->>DB: INSERT INTO promo_code_redemption
                    PROMO->>DB: UPDATE promo_code SET used_count = used_count + 1
                end
                DB-->>UC: COMMIT
                note over PROMO, DB: Si el checkout aborta, el canje no queda registrado y el<br/>código sigue disponible: no se quema una entrada gratis por un pago fallido.
            end
        end
    end
```

---

## 8. Bloque 3 · Generación, entrega y consulta de entradas

### SD-07 · Emisión del QR y su imagen

El token nace síncrono dentro de la transacción. La imagen se genera después, por evento.

```mermaid
sequenceDiagram
    autonumber
    participant UC as CheckoutUseCase
    participant DB as PostgreSQL
    participant BUS as EventBus
    participant SUB as QrImageSubscriber
    participant QRI as QrImagePort
    participant ST as StoragePort
    participant W as Billetera web

    note over UC, DB: Fase 1 · Token del QR, síncrono y transaccional
    UC->>UC: qrCode = randomBytes(24) en base64url
    UC->>UC: Ticket.issue con status valid, qrImageKey null y usedAt null
    UC->>DB: INSERT INTO ticket con qr_code UNIQUE
    DB-->>UC: COMMIT
    note over UC, DB: El token es impredecible y único. Es la ÚNICA fuente de verdad<br/>que se contrasta en puerta.

    note over UC, SUB: Fase 2 · Imagen del QR fuera del caso de uso (A8)
    UC-)BUS: TicketIssuedEvent { ticketId, eventId, userId, qrCode }
    BUS-)SUB: suscriptor de checkout.ticket_issued
    SUB->>QRI: render(qrCode)
    QRI-->>SUB: PNG del QR
    SUB->>ST: putObject(tickets/{ticketId}/qr.png, png, image/png)
    ST-->>SUB: key almacenada
    SUB->>DB: UPDATE ticket SET qr_image_key = ...
    DB-->>SUB: 1 row
    note over SUB, ST: El checkout ya no orquesta imágenes (SRP). Y es best-effort:<br/>si la subida falla, la entrada sigue siendo válida.

    note over W, ST: Fase 3 · Render en el cliente, con respaldo
    alt la entrada ya tiene qrImageKey
        W->>ST: resuelve la key a URL y muestra el PNG almacenado
    else todavía sin imagen
        W->>W: genera el QR en el navegador a partir del token con la librería qrcode
        note over W: Ambos caminos codifican el MISMO token, así que el escaneo<br/>en puerta funciona venga de donde venga.
    end
```

### SD-08 · Entrega asíncrona: PDF y notificaciones

Job `send-order-tickets`, encolado en la Tx del checkout y consumido por el worker.

```mermaid
sequenceDiagram
    autonumber
    participant RELAY as OutboxRelay
    participant Q as BullMQ · notifications
    participant WK as NotificationsProcessor
    participant PDF as TicketPdfService
    participant ST as StoragePort
    participant DB as PostgreSQL
    participant MAIL as EmailPort y PushPort

    note over RELAY, WK: Fase 1 · Del outbox a la cola → SD-B
    RELAY->>Q: add(send-order-tickets, { orderId, userId, ticketIds }, { jobId })
    Q->>WK: process(job)
    WK->>WK: valida el payload con orderTicketsJobSchema

    note over WK, DB: Fase 2 · Corte de idempotencia
    WK->>DB: SELECT id, pdf_url FROM ticket WHERE id IN (ticketIds)
    DB-->>WK: filas con pdf_url
    alt todas las entradas ya tienen pdf_url
        WK-->>Q: { ok true } sin regenerar nada
        note over WK, DB: ticket.pdf_url es la marca de "ya procesado":<br/>un reintento no vuelve a generar el PDF ni a reinsertar notificaciones.
    else falta procesar

        note over WK, MAIL: Fase 3 · Efectos en orden de fragilidad decreciente
        WK->>PDF: generate({ orderId, ticketIds })
        PDF-->>WK: buffer del PDF
        WK->>ST: putObject(tickets/{orderId}.pdf, pdf, application/pdf)
        ST-->>WK: key en S3
        WK->>DB: INSERT de dos filas NOTIFICATION, canal email y push, status sent
        DB-->>WK: 2 rows
        WK->>DB: UPDATE ticket SET pdf_url = key WHERE id IN (ticketIds)
        DB-->>WK: n rows
        note over WK, DB: Estrategia at-least-once: la marca de idempotencia se escribe la<br/>ÚLTIMA, de modo que un fallo antes de fijarla reintenta el trabajo entero.<br/>Ventana conocida de duplicado entre el INSERT y el UPDATE.
        WK->>MAIL: email.send y push.send
        MAIL-->>WK: entregado
        note over MAIL: EmailPort y PushPort son LogEmailAdapter y LogPushAdapter:<br/>registran el envío en el log, sin proveedor real (ADR 0004).
        WK-->>Q: { ok true }
    end
```

### SD-09 · Consulta: billetera y detalle de orden

`GET /api/v1/tickets/me` y `GET /api/v1/orders/{id}` · ambos autenticados.

```mermaid
sequenceDiagram
    autonumber
    actor U as Comprador
    participant W as Cliente web
    participant EDGE as Edge API
    participant UC as ListMyTickets y GetOrder
    participant DB as PostgreSQL
    participant ST as Storage (render)

    note over U, DB: Fase 1 · Billetera de entradas
    U->>W: abre /account/tickets
    W->>EDGE: GET /api/v1/tickets/me · Bearer
    EDGE->>UC: ListMyTicketsUseCase.execute(userId)
    UC->>DB: SELECT de las entradas del usuario con evento, local y tipo de entrada
    DB-->>UC: UserTicket[] con detalle
    UC-->>EDGE: UserTicket[]
    EDGE-->>W: 200 OK · TicketResponse[] con qrCode, qrImageKey, status, eventName y venueName
    W->>ST: resuelve qrImageKey o pinta el QR desde el token → SD-07
    W-->>U: tarjetas de entrada con su QR y su estado

    note over U, DB: Fase 2 · Detalle de una orden
    U->>W: abre el detalle de una compra
    W->>EDGE: GET /api/v1/orders/{id} · Bearer
    EDGE->>UC: GetOrderUseCase.execute({ orderId, userId })
    UC->>DB: SELECT * FROM "order" WHERE id = ?
    DB-->>UC: order o null
    alt no existe, o pertenece a otro usuario
        UC-->>EDGE: OrderNotFoundError
        EDGE-->>W: 404 · { code checkout/order_not_found }
        note over UC: Se responde 404 y no 403 también cuando la orden es de otro:<br/>un 403 confirmaría que ese id existe.
    else orden propia
        UC-->>EDGE: Order
        EDGE-->>W: 200 OK · OrderResponse con subtotal, discountTotal, commissionAmount, total e items
        W-->>U: resumen de la compra
    end
```

---

## 9. Bloque 4 · Validación en puerta

### SD-10 · Validación QR online en puerta

`POST /api/v1/validations/scan` · `@Roles('validator')` · `ValidateQrUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor V as Validador
    participant APP as App de puerta (Expo)
    participant EDGE as Edge API
    participant UC as ValidateQrUseCase
    participant INV as InventoryPort
    participant TR as TicketRepository
    participant DB as PostgreSQL

    note over V, EDGE: Fase 1 · Escaneo y autenticación por rol
    V->>APP: apunta la cámara al QR
    APP->>APP: registra solo la longitud del código, nunca su contenido (§6)
    APP->>EDGE: POST /api/v1/validations/scan · Bearer · { qrCode, deviceInfo }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('validator')
    EDGE->>UC: execute({ dto, validator del JWT })

    note over UC, DB: Fase 2 · Resolución del ticket y scope multi-tenant
    UC->>TR: findByQr(qrCode)
    TR->>DB: SELECT * FROM ticket WHERE qr_code = ?
    alt sin coincidencia
        DB-->>TR: null
        UC-->>EDGE: { result invalid, ticketId null, message "QR no válido" }
        EDGE-->>APP: 200 OK · veredicto invalid
        note over UC: Un QR desconocido no es un error HTTP: es un veredicto de puerta.
    else ticket encontrado
        DB-->>TR: ticket
        UC->>INV: getEvent(ticket.eventId)
        INV-->>UC: evento con localId y companyId
        note over UC, INV: C1 · el local y la empresa se derivan del EVENTO del ticket.<br/>El localId que manda el cliente se IGNORA por completo.
        UC->>UC: assertValidatorScope con el scope del JWT
        alt validador fuera de su local y de su empresa
            UC-->>EDGE: ValidatorScopeError
            EDGE-->>APP: 403 · { code checkout/qr_validation_forbidden }
            note over UC: super_admin pasa siempre. TODO C1 abierto: el scope es por local<br/>o empresa, todavía no por evento asignado.
        else scope correcto

            note over UC, DB: Fase 3 · Veredicto y marca atómica
            UC->>UC: ticket.validate() según el estado actual
            note over UC: valid → acceso permitido · used → already_used<br/>cancelled → cancelled · resto → invalid
            critical Tx única (UnitOfWork)
                alt el veredicto de dominio es valid
                    UC->>TR: markUsedIfValid(ticketId, tx)
                    TR->>DB: UPDATE ticket SET status = 'used', used_at = now() WHERE id = ? AND status = 'valid'
                    alt la sentencia tocó 1 fila
                        DB-->>TR: 1 row
                        UC->>DB: UPDATE event SET checkins_count = checkins_count + 1
                    else no tocó ninguna fila
                        DB-->>TR: 0 rows
                        UC->>UC: veredicto degradado a already_used
                        note over UC, DB: C2 · dos lectores simultáneos del mismo QR: la condición<br/>WHERE status = 'valid' deja pasar solo a uno. Sin doble check-in.
                    end
                end
                UC->>DB: INSERT INTO qr_validation con result, method scan y device_info
                note over UC, DB: Todo intento queda registrado, válido o no: la auditoría de<br/>puerta no depende del desenlace.
            end
            DB-->>UC: COMMIT
            UC-->>EDGE: { result, ticketId, attendeeName null, message }
            EDGE-->>APP: 200 OK · QrValidationResponse
            APP-->>V: banner verde para valid, rojo para el resto
        end
    end
```

### SD-11 · Cola offline y sincronización

`apps/validator` — online-first con degradación a SQLite local cuando falla la red.

```mermaid
sequenceDiagram
    autonumber
    actor V as Validador
    participant APP as Pantalla de escaneo
    participant API as api-client del validador
    participant SQL as SQLite local
    participant NET as NetInfo
    participant CTX as AuthProvider
    participant EDGE as Edge API

    note over V, EDGE: Fase 1 · Online primero
    V->>APP: escanea un QR
    APP->>API: validateQr(qrCode, token)
    API->>EDGE: POST /api/v1/validations/scan · Bearer
    alt respuesta del servidor
        EDGE-->>API: 200 OK · veredicto
        API-->>APP: QrValidationResponse
        APP-->>V: banner con el veredicto → SD-10
    else 401 token inválido o expirado
        EDGE-->>API: 401
        API-->>APP: ApiError 401
        APP->>CTX: signOut()
        APP-->>V: vuelta a la pantalla de login
    else fallo de red, sin respuesta del servidor
        API-->>APP: NetworkError

        note over APP, SQL: Fase 2 · Encolado local con dedupe
        APP->>SQL: INSERT OR IGNORE INTO pending_checkin (qr_code, scanned_at)
        note over SQL: UNIQUE(qr_code) e INSERT OR IGNORE (M20): escanear A, luego B,<br/>luego A otra vez no encola A dos veces ni provoca un falso already_used.
        SQL-->>APP: encolado, o ignorado por duplicado
        APP-->>V: banner ámbar "sin conexión, se sincronizará al recuperar red"
        note over API, APP: Solo se encola ante NetworkError. Un ApiError NO se encola:<br/>el servidor sí respondió y su veredicto es definitivo.
    end

    note over NET, EDGE: Fase 3 · Sincronización
    alt al montar la app con sesión
        CTX->>CTX: runSync()
    else NetInfo detecta reconexión
        NET-->>CTX: connected pasa de false a true
        CTX->>CTX: runSync()
    else el validador pulsa Sincronizar ahora
        V->>CTX: runSync()
    end
    CTX->>SQL: SELECT pendientes WHERE synced = 0 ORDER BY id ASC
    SQL-->>CTX: cola en orden de llegada
    loop por cada pendiente
        CTX->>EDGE: POST /validations/scan con el QR encolado
        alt aceptado
            EDGE-->>CTX: 200 OK · veredicto
            CTX->>SQL: UPDATE pending_checkin SET synced = 1 WHERE id = ?
            note over CTX: El veredicto se registra en el log por trazabilidad:<br/>un already_used al sincronizar es información, no ruido.
        else vuelve a fallar
            EDGE-->>CTX: error
            CTX->>CTX: corta el bucle y reintenta en la próxima oportunidad
            note over CTX, SQL: Se detiene ante el primer fallo para no quemar la cola entera<br/>contra un backend que sigue caído.
        end
    end
    CTX-->>V: contador de check-ins pendientes actualizado
    note over SQL, EDGE: scanned_at se guarda localmente pero NO viaja: ValidateQrDto no lo<br/>acepta, así que el check-in queda registrado con la hora de sincronización.
```

---

## 10. Trazabilidad: proceso → endpoint → código → estado

| Proceso | Endpoint(s) | Caso de uso / componente | Estado |
|---|---|---|---|
| Compra estándar | `POST /orders/checkout` | `CheckoutUseCase`, `LockPort`, `UnitOfWork`, `ConvertTicketHoldUseCase` | ✅ Implementado con cinco barreras anti-sobreventa (ADR 0009) |
| Reserva de cupo con TTL | `POST /ticket-holds` | `CreateTicketHoldUseCase`, `MaintenanceProcessor` (job `expire-ticket-holds`) | ✅ Implementado — TTL configurable por `TICKET_HOLD_TTL_SECONDS` |
| Idempotencia de compra | `POST /orders/checkout` + `Idempotency-Key` | `RedisIdempotencyStore` | ⚠️ Best-effort sobre Redis (M3) |
| Pago | — (interno al checkout) | `PaymentPort` → `MockPaymentAdapter` | ⚠️ Mock que aprueba siempre, sin pasarela real |
| Código promocional | `POST /promoters/me/redemption-codes`, `GET /promoters/me/redemption-codes` | `GenerateRedemptionCodeUseCase` | ✅ Implementado |
| Resolución y enlace corto | `GET /p/{code}` (web), resolución pública del código | `ResolveRedemptionCodeUseCase` | ✅ Implementado |
| Canje y entrada gratuita | — (dentro del checkout) | `PromoRedemptionPort`, `PromoCode.computeDiscount` | ✅ Implementado — gratis es descuento del 100 % |
| Validación de promo en preview | `POST /promo-codes/validate` | `ValidatePromoCodeUseCase` | ✅ Implementado |
| Generación de entradas | — (dentro del checkout) | `Ticket.issue`, `QrImageSubscriber`, `QrcodeImageAdapter` | ✅ Implementado, imagen best-effort |
| Entrega de entradas | job `send-order-tickets` | `OutboxRelay`, `NotificationsProcessor`, `TicketPdfService` | ⚠️ PDF y S3 reales, envío de correo y push en stub (ADR 0004) |
| Consulta de entradas | `GET /tickets/me`, `GET /orders/{id}` | `ListMyTicketsUseCase`, `GetOrderUseCase` | ✅ Implementado |
| Validación QR online | `POST /validations/scan` | `ValidateQrUseCase`, `markUsedIfValid` | ✅ Implementado con marca atómica |
| Cola offline | — (local en el dispositivo) | `offline-cache.ts`, `AuthProvider.runSync` | ⚠️ Funciona, pero pierde la hora real del escaneo |

---

## 11. Brechas y riesgos detectados al levantar los flujos

Hallazgos de la lectura del código, ordenados por impacto. No forman parte del pedido, pero
condicionan la fidelidad de los diagramas.

1. **La comisión se calcula pero no se cobra.** `commissionAmount = subtotal * 0.1` y
   `total = subtotal - discountTotal`: la comisión **no** se suma al total. Hoy es un dato informativo
   en la orden. Conviene confirmar si el modelo es "comisión descontada al local" o si falta sumarla
   al cargo del comprador.
2. **Un pago rechazado no deja rastro.** El `PAYMENT` en estado rechazado se crea dentro de la Tx y el
   rollback lo descarta (TODO M3 anotado en el propio código). Sin trazabilidad de intentos fallidos
   no hay forma de investigar una disputa. Con pasarela real habría que sacar el cobro de la Tx y
   compensar.
3. **`MockPaymentAdapter` aprueba siempre.** La rama de rechazo del diagrama es inalcanzable en
   ejecución: no existe pasarela real, y por tanto tampoco reembolsos ni cancelación de órdenes.
4. **El check-in offline pierde su hora real.** `scannedAt` se persiste en SQLite pero no viaja:
   `ValidateQrDto` no lo acepta. Un lote sincronizado a las 3 a.m. queda registrado con esa hora, no
   con la del escaneo en puerta. Afecta a cualquier informe de aforo por franja.
5. **El validador no ve el nombre del asistente.** `QrValidationResponse.attendeeName` se devuelve
   siempre en `null`, así que en puerta no se puede contrastar el documento contra el titular de la
   entrada, que es justamente la razón de pedir los datos de cada asistente en el checkout.
6. **El scope del validador es por local o empresa, no por evento.** Un validador con scope en un
   local puede validar entradas de cualquier evento de ese local, incluidos los que no le asignaron
   (TODO C1 anotado en el código).
7. **El dedupe de checkout depende de Redis.** Sin Redis no hay idempotencia ni lock por evento: la
   defensa que queda es el `CHECK sold <= stock`, que evita la sobreventa pero no el doble cobro.
8. **La cola offline no tiene techo ni caducidad.** Un dispositivo mucho tiempo sin red acumula filas
   indefinidamente, y al sincronizar dispara tantas peticiones como escaneos tenga guardados.
9. **Ventana de duplicado en la entrega.** En `handleOrderTickets`, un crash entre el `INSERT` de las
   filas `NOTIFICATION` y el `UPDATE` de `ticket.pdf_url` duplica las notificaciones en el reintento.
   Está documentado y asumido para el piloto, porque email y push son stubs sin efecto externo.

---

## 12. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§N). Toda desviación se registra
  como ADR en `docs/adr/`.
- Al cambiar `CheckoutUseCase`, `ValidateQrUseCase`, el `PromoRedemptionPort`, el relay del outbox o
  la app de validación, actualizar el diagrama correspondiente **en el mismo PR** y revisar la tabla
  del §10.
- Antes de mergear, ejecutar el comando de validación de §3.6: los 13 diagramas deben renderizar.
- Los diagramas nombran casos de uso, endpoints, claves de Redis y columnas reales a propósito: un
  `grep` del nombre en el repo debe encontrar el código. Si no lo encuentra, el diagrama está
  desactualizado.
