# Eventos e inventario — Diagramas de secuencia y flujo de protocolo

**Serie:** [Diagramas de secuencia](./README.md) · **Dominio 4 del DER** — *Events & Ticket Types* (§4.1 de `PROJECT_SPECS.md`)

> **Alcance.** Tres procesos del dominio *Eventos e inventario*, agrupados en cinco bloques y
> representados con **13 diagramas de secuencia Mermaid** más **1 diagrama de estados** complementario,
> en formato *protocol data flow*: cada flecha lleva su método, ruta, código de estado y forma del
> payload; cada fase del pipeline va marcada con un banner. Reflejan el código real de `apps/api`
> (módulo `events`, con el consumo de inventario desde `ticketing`) y `apps/web` (panel de local y
> superficies públicas de agenda).
>
> Mismo estándar de notación que `docs/diagramas-secuencia/01-identidad-acceso.md`.
> Fecha de levantamiento: 2026-07-28 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Proceso cubierto |
|---|---|---|
| SD-A | [Aislamiento por tenant en Events](#sd-a--aislamiento-por-tenant-en-events) | sub-flujo compartido |
| SD-B | [Flyer en staging: validar y promover](#sd-b--flyer-en-staging-validar-y-promover) | sub-flujo compartido |
| SD-01 | [Crear un evento con flyer](#sd-01--crear-un-evento-con-flyer) | Crear evento |
| SD-02 | [Editar un evento](#sd-02--editar-un-evento) | Editar evento |
| SD-03 | [Publicar un evento](#sd-03--publicar-un-evento) | Publicar evento |
| SD-04 | [Cancelar un evento](#sd-04--cancelar-un-evento) | Cancelar evento |
| SD-05 | [Configurar tipos de entrada](#sd-05--configurar-tipos-de-entrada) | Tipos de entrada y stock |
| SD-06 | [Consumo del stock desde checkout](#sd-06--consumo-del-stock-desde-checkout) | Stock |
| SD-07 | [Ajustar stock y pausar la venta](#sd-07--ajustar-stock-y-pausar-la-venta) — AS-IS y TO-BE | Stock |
| SD-08 | [Agenda pública](#sd-08--agenda-pública) | Consultar agenda |
| SD-09 | [Agenda de administración](#sd-09--agenda-de-administración) | Consultar agenda y estados |
| SD-10 | [Métricas del local](#sd-10--métricas-del-local) | Métricas |
| ED-1 | [Máquina de estados del evento](#ed-1--máquina-de-estados-del-evento) | Estados de evento |

---

## 2. Agrupación de los procesos

Los tres procesos comparten un mismo eje: el evento es el aggregate y el tipo de entrada es su
inventario, pero **quien escribe el stock no es este módulo**, sino el checkout a través de un puerto.
Esa separación explica por qué el bloque de inventario tiene tres diagramas y no uno.

| Bloque | Procesos | Razón de la agrupación |
|---|---|---|
| **0 · Sub-flujos compartidos** | — | `assertTenant` sobre `companyIdForLocal` (SD-A) gobierna las cinco escrituras del módulo. La validación y promoción del flyer (SD-B) es idéntica en crear y editar. |
| **1 · Ciclo de vida del evento** | Crear, editar, publicar y cancelar | Cuatro comandos sobre el mismo aggregate, con la misma comprobación de tenant y distinta transición de estado. Se separan porque cada uno tiene invariantes y eventos de dominio propios. |
| **2 · Inventario** | Configurar tipos de entrada y stock | Crear el tipo (SD-05) y consumirlo (SD-06) están en módulos distintos. Ajustarlo después (SD-07) no existe, y merece su propio diagrama con el estado real y la propuesta. |
| **3 · Consulta** | Consultar agenda, métricas y estados | Tres audiencias con tres superficies: catálogo público con ISR, panel del tenant con lecturas aisladas, y KPIs agregados. |
| **4 · Estados** | Estados de evento | El ciclo completo se lee mejor como máquina de estados que como secuencia. Va como complemento, no como sustituto. |

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
9. **Infraestructura con su comando real**, no con una paráfrasis: `SELECT * FROM event WHERE slug = ?`,
   `copyObject`. Hace el diagrama auditable
   contra los adapters Drizzle y Redis.
10. **Placeholders entre llaves**, nunca entre `<` `>` (Mermaid los interpreta como HTML): `{eventId}`.

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
  -i docs/diagramas-secuencia/04-eventos-inventario.md \
  -o /tmp/04-eventos-inventario.md
```

También sirven mermaid.live y la extensión *Markdown Preview Mermaid Support* de VS Code. GitHub
renderiza estos bloques de forma nativa.

---

## 4. Catálogo de participantes

| Alias | Componente real | Archivo |
|---|---|---|
| `U` | Administrador de local, o visitante en las superficies públicas | — |
| `W` | Componente cliente del panel o Server Component del catálogo | `apps/web/**` |
| `EDGE` | Pipeline global del API: `RateLimit → Auth → Roles` + `ZodValidationPipe` | `apps/api/src/edge/**` |
| `UC` | Caso de uso (capa aplicación) | `apps/api/src/modules/events/application/use-cases/**` |
| `TEN` | `EventTenantPort` — resuelve la empresa dueña de un local | `.../events/domain/ports/event-tenant.port.ts` |
| `DOM` | Aggregates `Event` y `TicketType` | `.../events/domain/entities/**` |
| `EREP` | `EventRepository` (adapter Drizzle) | `.../infrastructure/persistence/drizzle-event.repository.ts` |
| `TREP` | `TicketTypeRepository` | `.../drizzle-ticket-type.repository.ts` |
| `FLY` | `flyer-storage` — validación y promoción del flyer | `.../events/application/services/flyer-storage.ts` |
| `ST` | `StoragePort` sobre S3 compatible | `apps/api/src/shared/adapters/storage/**` |
| `INV` | `InventoryPort` — lo consume `ticketing`, escribe sobre `ticket_type` | `.../ticketing/domain/ports/inventory.repository.ts` |
| `BUS` | `EventBus` in-process | `apps/api/src/shared/event-bus/event-bus.ts` |
| `DB` | PostgreSQL vía Drizzle | `packages/db/src/schema/events.ts` |

### Superficie de endpoints

| Método y ruta | Acceso | Caso de uso |
|---|---|---|
| `GET /events` | público | `ListEventsUseCase` |
| `GET /events/trending` · `GET /events/upcoming` | público | `ListTrendingEventsUseCase` · `ListUpcomingEventsUseCase` |
| `GET /events/{slug}` | público | `GetEventUseCase` |
| `GET /events/{id}/ticket-types` | público | `ListTicketTypesUseCase` |
| `GET /events/mine?localId=` | `admin_local` | `ListMyEventsUseCase` |
| `GET /events/manage/{id}` | `admin_local` | `GetMyEventUseCase` |
| `GET /events/stats/{localId}` | `admin_local` | `GetLocalStatsUseCase` |
| `POST /events` · `PATCH /events/{id}` | `admin_local` | `CreateEventUseCase` · `UpdateEventUseCase` |
| `POST /events/{id}/publish` · `POST /events/{id}/cancel` | `admin_local` | `PublishEventUseCase` · `CancelEventUseCase` |
| `POST /ticket-types` | `admin_local` | `CreateTicketTypeUseCase` |

---

## 5. Bloque 0 · Sub-flujos compartidos

### SD-A · Aislamiento por tenant en Events

A diferencia de Companies, aquí el módulo no conoce el `companyId` del recurso: lo resuelve por puerto
a partir del local del evento.

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant EDGE as Edge API
    participant CTL as EventsController
    participant UC as Caso de uso
    participant TEN as EventTenantPort
    participant DB as PostgreSQL

    note over AD, CTL: Fase 1 · Scope derivado del JWT en un solo punto
    AD->>EDGE: comando sobre un evento o tipo de entrada · Authorization Bearer
    EDGE->>EDGE: AuthGuard adjunta roles, companyId y localId · RolesGuard exige admin_local
    EDGE->>CTL: handler del recurso
    CTL->>CTL: tenantScopeOf(actor) produce { isSuperAdmin, companyId }
    CTL->>UC: execute({ ...dto, scope })
    note over CTL: El controller no repite lógica de rol ni de empresa:<br/>la derivación del scope vive en un único helper del edge.

    note over UC, DB: Fase 2 · Empresa dueña resuelta por el local del evento
    opt el comando actúa sobre un evento existente
        UC->>DB: SELECT * FROM event WHERE id = ?
        DB-->>UC: evento o null
        alt no existe
            UC-->>EDGE: EventNotFoundError
            EDGE-->>AD: 404 · { code events/event_not_found }
        end
    end
    UC->>TEN: companyIdForLocal(localId)
    TEN->>DB: SELECT company_id FROM local WHERE id = ?
    DB-->>TEN: companyId o null
    TEN-->>UC: companyId
    UC->>UC: assertTenant(scope, companyId)
    alt el local es de otra empresa
        UC-->>EDGE: TenantForbiddenError
        EDGE-->>AD: 403 · problem+json
        note over UC, TEN: Events no importa el módulo Companies: pregunta por un puerto.<br/>super_admin atraviesa la comprobación.
    else autorizado
        UC->>DB: escritura sobre el aggregate
        DB-->>UC: filas afectadas
        UC-->>EDGE: entidad
        EDGE-->>AD: 200 o 201 · DTO
    end
```

### SD-B · Flyer en staging: validar y promover

`flyer-storage` es el equivalente en Events del confirm de imágenes de local. Lo comparten crear y
editar.

```mermaid
sequenceDiagram
    autonumber
    participant UC as CreateEvent o UpdateEvent
    participant FLY as flyer-storage
    participant ST as StoragePort
    participant S3 as Bucket de objetos
    participant DB as PostgreSQL

    note over UC, S3: Fase 1 · Validación server-side de la key de staging
    UC->>FLY: validateStagedFlyer(storage, flyerKey)
    FLY->>FLY: la key debe empezar por tmp/
    alt no es una key de staging
        FLY-->>UC: EventFlyerInvalidError · 400 events/event_flyer_invalid
    else key de staging
        FLY->>ST: headObject(flyerKey)
        ST->>S3: HEAD del objeto
        alt el objeto no existe o expiró
            S3-->>ST: no encontrado
            FLY-->>UC: EventFlyerNotFoundError · 404 events/event_flyer_not_found
        else objeto presente
            S3-->>ST: { sizeBytes, contentType } reales
            ST-->>FLY: metadatos
            alt supera el tamaño máximo o el tipo no está permitido
                FLY->>ST: deleteObject(flyerKey) — no se deja basura en staging
                FLY-->>UC: EventFlyerInvalidError · 400
                note over FLY, S3: No se confía en lo declarado por el cliente en el presign:<br/>se contrastan tamaño y tipo REALES del objeto.
            else objeto válido

                note over UC, DB: Fase 2 · Promoción a la carpeta del evento
                UC->>FLY: promoteStagedFlyer(storage, eventId, flyerKey)
                FLY->>ST: copyObject(tmp/{archivo}, events/{eventId}/{archivo})
                FLY->>ST: deleteObject(tmp/{archivo})
                ST-->>FLY: objeto promovido
                FLY-->>UC: key final events/{eventId}/{archivo}
                UC->>DB: UPDATE event SET flyer_url = key final
                note over UC, DB: Se persiste la KEY y nunca la URL: los datos quedan<br/>independientes del entorno y del CDN.
            end
        end
    end
```

---

## 6. Bloque 1 · Ciclo de vida del evento

### SD-01 · Crear un evento con flyer

`POST /api/v1/events` · `@Roles('admin_local')` · `CreateEventUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as CreateEventWizard
    participant EDGE as Edge API
    participant UC as CreateEventUseCase
    participant TEN as EventTenantPort
    participant FLY as flyer-storage
    participant EREP as EventRepository
    participant DB as PostgreSQL

    note over AD, W: Fase 1 · Datos y flyer en staging
    AD->>W: nombre, fechas, aforo, nota de edad, código de vestimenta
    opt sube un flyer
        W->>W: useStagedUpload deja la imagen en tmp/ y guarda la key
    end
    W->>W: slug generado desde el nombre, con reintento por colisión
    W->>EDGE: POST /api/v1/events · Bearer · CreateEventDto con flyerKey opcional
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → Zod(createEventSchema)
    EDGE->>UC: execute({ dto, createdBy, scope })

    note over UC, DB: Fase 2 · Tenant, unicidad de slug y validación temprana del flyer
    UC->>TEN: companyIdForLocal(dto.localId) más assertTenant → SD-A
    alt el local es de otra empresa
        UC-->>EDGE: TenantForbiddenError · 403
    else local propio
        UC->>EREP: existsBySlug(dto.slug)
        EREP->>DB: SELECT id FROM event WHERE slug = ?
        DB-->>EREP: fila o vacío
        alt slug ocupado
            UC-->>EDGE: EventSlugTakenError
            EDGE-->>W: 409 · { code events/event_slug_taken }
            note over W, EDGE: El cliente reintenta con otro sufijo. El slug es el permalink<br/>público y es inmutable una vez creado.
        else slug libre
            opt hay flyerKey
                UC->>FLY: validateStagedFlyer → SD-B
                note over UC, FLY: Se valida ANTES del INSERT para fallar temprano y no dejar<br/>un evento a medias. La promoción necesita el id, así que va después.
            end

            note over UC, DB: Fase 3 · Alta en borrador y promoción del flyer
            UC->>UC: Event.create con status draft, ticketsSold 0, checkinsCount 0
            UC->>EREP: create(event)
            EREP->>DB: INSERT INTO event
            DB-->>EREP: fila creada
            opt había flyer validado
                UC->>FLY: promoteStagedFlyer(storage, eventId, flyerKey) → SD-B
                FLY-->>UC: key final
                UC->>EREP: update(event) con la key del flyer
                EREP->>DB: UPDATE event SET flyer_url = ?
            end
            UC-->>EDGE: Event
            EDGE-->>W: 201 Created · EventResponse { status draft }
            W-->>AD: evento creado en borrador
            note over W, AD: El evento nace invisible: solo status published entra<br/>en el catálogo público.
        end
    end
```

### SD-02 · Editar un evento

`PATCH /api/v1/events/{id}` · `@Roles('admin_local')` · `UpdateEventUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as EditEventDialog
    participant EDGE as Edge API
    participant UC as UpdateEventUseCase
    participant DOM as Aggregate Event
    participant FLY as flyer-storage
    participant EREP as EventRepository
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Envío parcial
    AD->>W: modifica los campos que quiera y, si toca, sube un flyer nuevo
    W->>EDGE: PATCH /api/v1/events/{id} · Bearer · solo los campos presentes
    note over W, EDGE: PATCH y no PUT: se aplica lo enviado. El slug NO se edita porque<br/>es el permalink público del evento.
    EDGE->>EDGE: AuthGuard → RolesGuard → Zod(updateEventSchema)
    EDGE->>UC: execute({ eventId, dto, scope })
    UC->>EREP: findById(eventId) más assertTenant → SD-A
    EREP-->>UC: Event o error 404 o 403

    note over UC, DOM: Fase 2 · Aplicación del patch en el dominio
    UC->>DOM: event.edit(patch)
    DOM->>DOM: aplica solo los campos definidos y actualiza updatedAt
    DOM->>DOM: null explícito en un campo anulable lo limpia
    opt vienen customTags
        DOM->>DOM: normaliza etiquetas libres, recorta a 40 caracteres y deduplica sin acentos
        note over DOM: Máximo 50 etiquetas libres. La primera grafía gana<br/>en caso de duplicado.
    end

    note over UC, DB: Fase 3 · Flyer nuevo y taxonomías
    opt viene flyerKey
        UC->>FLY: promoteStagedFlyer → SD-B
        FLY-->>UC: key final
        UC->>DOM: event.setFlyer(keyFinal)
        opt el flyer anterior era una key nuestra del evento
            UC->>FLY: deleteObject del flyer anterior, best-effort
            note over UC, FLY: Si el borrado falla se registra un warning y se continúa:<br/>no bloquea la edición. Una URL externa o de seed no se toca.
        end
    end
    UC->>EREP: update(event)
    EREP->>DB: UPDATE event
    DB-->>EREP: 1 row
    opt vienen genreIds
        UC->>EREP: setGenres(eventId, genreIds) — borra e inserta el set completo
    end
    opt vienen tagIds
        UC->>EREP: setTags(eventId, tagIds) — borra e inserta el set completo
    end
    note over UC, DB: Enviar el array reemplaza el set actual. Omitirlo no lo toca.
    UC->>EREP: findById(eventId) — relectura con las taxonomías ya aplicadas
    EREP-->>UC: Event completo
    UC-->>EDGE: Event
    EDGE-->>W: 200 OK · EventResponse con genreIds, tagIds y customTags
    W-->>AD: cambios guardados
```

### SD-03 · Publicar un evento

`POST /api/v1/events/{id}/publish` · `@Roles('admin_local')` · `PublishEventUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Tabla de eventos del panel
    participant EDGE as Edge API
    participant UC as PublishEventUseCase
    participant DOM as Aggregate Event
    participant EREP as EventRepository
    participant BUS as EventBus
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Acción desde la fila del evento
    AD->>W: pulsa Publicar
    W->>W: la opción solo aparece en estado draft o scheduled
    W->>EDGE: POST /api/v1/events/{id}/publish · Bearer
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local')
    EDGE->>UC: execute({ eventId, scope })

    note over UC, DB: Fase 2 · Tenant e invariante de publicación
    UC->>EREP: findById(eventId)
    EREP->>DB: SELECT * FROM event WHERE id = ?
    alt no existe
        DB-->>EREP: null
        UC-->>EDGE: EventNotFoundError
        EDGE-->>W: 404 · { code events/event_not_found }
    else existe
        DB-->>EREP: Event
        UC->>UC: assertTenant con la empresa del local → SD-A
        UC->>DOM: canPublish()
        DOM->>DOM: devuelve false solo si el estado es cancelled o finished
        note over DOM: Invariante mínima: NO se comprueba que exista al menos un tipo<br/>de entrada, ni flyer, ni que la fecha sea futura. Ver §11.
        alt no publicable
            UC-->>EDGE: EventNotPublishableError
            EDGE-->>W: 409 · { code events/event_not_publishable }
        else publicable
            UC->>DOM: event.publish() pone status published y sella publishedAt
            UC->>EREP: update(event)
            EREP->>DB: UPDATE event SET status = 'published', published_at = now()
            DB-->>EREP: 1 row
            UC-)BUS: EventPublishedEvent { eventId, localId }
            UC-->>EDGE: Event
            EDGE-->>W: 200 OK · EventResponse { status published }
            W->>W: invalida la lista de eventos del local
            W-->>AD: evento visible en el catálogo público
            note over BUS: Nadie escucha este evento hoy: publicar no dispara<br/>notificaciones ni avisos a seguidores del local.
        end
    end
```

### SD-04 · Cancelar un evento

`POST /api/v1/events/{id}/cancel` · `@Roles('admin_local')` · `CancelEventUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Diálogo de cancelación
    participant EDGE as Edge API
    participant UC as CancelEventUseCase
    participant EREP as EventRepository
    participant BUS as EventBus
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Motivo obligatorio en el formulario
    AD->>W: pulsa Cancelar evento y escribe el motivo
    W->>W: exige mínimo 3 caracteres antes de enviar
    W->>EDGE: POST /api/v1/events/{id}/cancel · Bearer · { reason }
    EDGE->>EDGE: AuthGuard → RolesGuard → Zod(cancelEventSchema) valida reason de 3 a 255
    EDGE->>UC: execute({ eventId, scope })
    note over EDGE, UC: El motivo se valida y se DESCARTA: el controller lo recibe en un<br/>parámetro sin usar y el caso de uso ni siquiera lo acepta. Ver §11.

    note over UC, DB: Fase 2 · Transición terminal
    UC->>EREP: findById(eventId)
    alt no existe
        UC-->>EDGE: EventNotFoundError
        EDGE-->>W: 404 · { code events/event_not_found }
    else existe
        UC->>UC: assertTenant con la empresa del local → SD-A
        UC->>UC: event.cancel() pone status cancelled
        note over UC: No hay guardas: se puede cancelar un evento ya cancelado,<br/>y la operación es idempotente de hecho, no por diseño.
        UC->>EREP: update(event)
        EREP->>DB: UPDATE event SET status = 'cancelled'
        DB-->>EREP: 1 row
        UC-)BUS: EventCancelledEvent { eventId, localId }
        UC-->>EDGE: Event
        EDGE-->>W: 200 OK · EventResponse { status cancelled }
        W-->>AD: evento retirado del catálogo público
    end
    note over BUS, DB: Sin suscriptores: cancelar NO avisa a quien ya compró, no genera<br/>reembolso y no invalida las entradas emitidas. El único efecto<br/>colateral es la limpieza perezosa de favoritos al leer Guardados.
```

---

## 7. Bloque 2 · Inventario

### SD-05 · Configurar tipos de entrada

`POST /api/v1/ticket-types` · `@Roles('admin_local')` · `CreateTicketTypeUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as CreateTicketTypeDialog
    participant EDGE as Edge API
    participant UC as CreateTicketTypeUseCase
    participant DOM as Aggregate TicketType
    participant TREP as TicketTypeRepository
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Definición del tramo de venta
    AD->>W: nombre, categoría general vip o premium, precio, moneda y stock
    AD->>W: tope por usuario y ventana de venta, ambos opcionales
    W->>EDGE: POST /api/v1/ticket-types · Bearer · CreateTicketTypeDto
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → Zod(createTicketTypeSchema)
    EDGE->>UC: execute({ dto, scope })

    note over UC, DB: Fase 2 · Evento existente y del propio tenant
    UC->>DB: SELECT * FROM event WHERE id = ?
    alt el evento no existe
        DB-->>UC: null
        UC-->>EDGE: EventNotFoundError
        EDGE-->>W: 404 · { code events/event_not_found }
    else existe
        DB-->>UC: Event
        UC->>UC: assertTenant con la empresa del local del evento → SD-A
        alt evento de otra empresa
            UC-->>EDGE: TenantForbiddenError · 403
        else propio

            note over DOM, DB: Fase 3 · Alta del inventario
            UC->>DOM: TicketType.create(...)
            DOM->>DOM: sold 0 y status active
            DOM-->>UC: TicketType
            UC->>TREP: create(ticketType)
            TREP->>DB: INSERT INTO ticket_type con CHECK sold menor o igual que stock
            DB-->>TREP: fila creada
            note over DOM, DB: La invariante sold menor o igual que stock vive en la base:<br/>es la garantía dura contra la sobreventa, no una regla de aplicación.
            UC-->>EDGE: TicketType
            EDGE-->>W: 201 Created · TicketTypeResponse { remaining, status active }
            W-->>AD: tramo de venta disponible
            note over W, AD: No se comprueba que el evento esté en borrador: se pueden añadir<br/>tramos a un evento ya publicado y a la venta.
        end
    end
```

### SD-06 · Consumo del stock desde checkout

Quién escribe el inventario. El módulo Events **define** el stock, el módulo Ticketing lo **consume**
por `InventoryPort`, sin importar el módulo Events.

```mermaid
sequenceDiagram
    autonumber
    participant CO as CheckoutUseCase (ticketing)
    participant INV as InventoryPort
    participant DB as PostgreSQL
    participant PUB as Lecturas públicas de Events
    participant W as Panel y fichas

    note over CO, DB: Fase 1 · Lectura previa, fuera de la transacción
    CO->>INV: getEvent(eventId)
    INV->>DB: SELECT del evento con su local y la empresa dueña
    DB-->>INV: SaleEvent con isOnSale
    INV-->>CO: evento o null
    note over INV: isOnSale se deriva de status published. La capacidad total del<br/>evento NO viaja en SaleEvent y no limita nada. Ver §11.
    CO->>INV: getTicketType(ticketTypeId)
    INV->>DB: SELECT del tramo con price, stock, sold, maxPerUser y status
    DB-->>INV: SaleTicketType
    INV-->>CO: tramo
    CO->>CO: comprueba status active, tope por usuario y stock menos sold suficiente
    note over CO: saleStartsAt y saleEndsAt NO se evalúan aquí: la ventana de venta<br/>que se guardó al crear el tramo es hoy decorativa. Ver §11.

    note over CO, DB: Fase 2 · Reserva dentro de la transacción del checkout
    critical Tx del checkout, bajo lock por evento
        CO->>INV: getTicketType(ticketTypeId, tx) — relectura con la conexión transaccional
        INV-->>CO: stock y sold frescos
        CO->>INV: incrementSold(ticketTypeId, qty, tx)
        INV->>DB: UPDATE ticket_type SET sold = sold + qty
        note over DB: Si la CHECK sold menor o igual que stock se viola, la Tx aborta:<br/>última barrera anti-sobreventa.
        CO->>INV: incrementEventTicketsSold(eventId, qty, tx)
        INV->>DB: UPDATE event SET tickets_sold = tickets_sold + qty
    end
    DB-->>CO: COMMIT

    note over PUB, W: Fase 3 · Los contadores alimentan la lectura
    PUB->>DB: GET /events/{id}/ticket-types calcula remaining como stock menos sold
    DB-->>PUB: tramos con su disponibilidad
    PUB-->>W: barra de disponibilidad en la ficha pública y en la tabla del panel
    note over PUB, W: ticketsSold y checkinsCount son contadores denormalizados en event:<br/>de ahí salen el porcentaje de ocupación y los KPIs (SD-10), sin agregados costosos.
```

### SD-07 · Ajustar stock y pausar la venta

#### SD-07a · Estado actual (AS-IS)

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Tabla de tipos de entrada
    participant EDGE as Edge API

    note over W, EDGE: Fase única · No hay camino de ajuste
    AD->>W: quiere subir el stock, cambiar el precio o pausar la venta de un tramo
    note over EDGE: TicketTypesController expone únicamente POST de creación.<br/>No hay PATCH, ni PUT, ni endpoint de estado.
    note over W: La tabla del panel es de solo lectura y lo documenta en el propio<br/>código: "lectura: el backend no edita".
    W-->>AD: sin acción disponible
    note over AD, EDGE: TicketTypeStatus define paused y sold_out, pero ningún código los<br/>asigna: un tramo nace active y muere active. Agotar el stock no<br/>cambia el estado, solo deja remaining en cero.
```

#### SD-07b · Diseño propuesto (TO-BE)

Propuesta calcada del `PATCH /events/{id}` que ya funciona, con la salvedad de que el stock es un
recurso en disputa.

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as Diálogo de edición de tramo
    participant EDGE as Edge API
    participant UC as UpdateTicketTypeUseCase propuesto
    participant LOCK as Redis · lock por evento
    participant DB as PostgreSQL

    note over AD, EDGE: Fase 1 · Patch parcial del tramo
    AD->>W: ajusta stock, precio, tope por usuario, ventana de venta o estado
    W->>EDGE: PATCH /api/v1/ticket-types/{id} · Bearer · solo los campos presentes
    EDGE->>UC: execute({ ticketTypeId, dto, scope })
    UC->>DB: SELECT del tramo con su evento, más assertTenant → SD-A
    DB-->>UC: TicketType o error 404 o 403

    note over UC, DB: Fase 2 · El stock se toca bajo el mismo lock que el checkout
    opt cambia el stock
        UC->>LOCK: withLock(event:{eventId}, TTL 10 s)
        note over UC, LOCK: Mismo lock que usa el checkout: bajar el stock mientras alguien<br/>compra dejaría sold por encima de stock y abortaría compras en curso.
        UC->>UC: el stock nuevo no puede ser menor que sold
        alt stock nuevo menor que lo ya vendido
            UC-->>EDGE: error de dominio · 409 stock por debajo de lo vendido
        else stock válido
            UC->>DB: UPDATE ticket_type SET stock = ?
        end
    end
    opt cambia el estado
        UC->>DB: UPDATE ticket_type SET status = 'active' o 'paused'
        note over UC, DB: paused corta la venta sin borrar el tramo ni perder el histórico.<br/>El checkout ya rechaza cualquier estado distinto de active.
    end
    opt cambia precio, tope o ventana de venta
        UC->>DB: UPDATE de los campos correspondientes
        note over UC, DB: El precio ya viaja como snapshot en cada order_item, así que<br/>cambiarlo no altera órdenes pasadas.
    end
    DB-->>UC: filas actualizadas
    UC-->>EDGE: TicketType
    EDGE-->>W: 200 OK · TicketTypeResponse
    W-->>AD: tramo actualizado
```

---

## 8. Bloque 3 · Consulta de agenda y métricas

### SD-08 · Agenda pública

`GET /events`, `/events/trending`, `/events/upcoming` · públicos, con ISR en el cliente.

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant PG as Rutas públicas de eventos
    participant CACHE as Data Cache de Next
    participant EDGE as Edge API
    participant UC as List, Trending y Upcoming
    participant DB as PostgreSQL

    note over U, CACHE: Fase 1 · Superficies de agenda
    alt listado con filtros
        U->>PG: GET /events con q, zona, género, etiqueta y página
        PG->>CACHE: getEvents(...) con revalidate 60
    else calendario por día
        U->>PG: GET /events/calendar
        PG->>CACHE: getUpcomingEvents() con revalidate 60
    else tendencias en el home
        U->>PG: GET /
        PG->>CACHE: getTrendingEvents() con revalidate 60
    end

    note over CACHE, DB: Fase 2 · Consulta pública si la caché venció
    CACHE->>EDGE: GET de la ruta correspondiente
    EDGE->>EDGE: AuthGuard @Public → ZodValidationPipe cuando hay query
    EDGE->>UC: caso de uso de lectura
    alt listado
        UC->>DB: SELECT ... WHERE status = 'published' con los filtros y ORDER BY starts_at DESC
    else próximos
        UC->>DB: SELECT ... WHERE status = 'published' AND starts_at mayor o igual que ahora
    else tendencias
        UC->>DB: SELECT ... WHERE status = 'published' ORDER BY tickets_sold DESC y checkins_count DESC
        note over UC, DB: Tendencia se ordena por los contadores denormalizados que<br/>alimenta el checkout (SD-06), sin agregados en tiempo real.
    end
    DB-->>UC: filas
    UC-->>EDGE: Event[]
    EDGE-->>CACHE: 200 OK · EventResponse[]
    CACHE->>CACHE: almacena con TTL de 60 s

    note over PG, U: Fase 3 · Render
    CACHE-->>PG: lista
    alt el calendario agrupa por día
        PG->>PG: agrupa por fecha legible y ordena las secciones
    end
    PG-->>U: tarjetas de evento, o EmptyState si no hay resultados
    note over PG, U: Solo status published llega al público. draft, cancelled y<br/>finished quedan fuera de todas estas consultas.
```

### SD-09 · Agenda de administración

`GET /events/mine?localId=` y `GET /events/manage/{id}` · `@Roles('admin_local')`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant W as EventsTable del panel
    participant EDGE as Edge API
    participant UC as ListMyEvents y GetMyEvent
    participant TEN as EventTenantPort
    participant DB as PostgreSQL

    note over AD, DB: Fase 1 · Eventos de un local, en todos los estados
    AD->>W: abre la gestión de un local
    W->>EDGE: GET /api/v1/events/mine?localId={id} · Bearer
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local') → ParseUUIDPipe del localId
    EDGE->>UC: ListMyEventsUseCase.execute({ localId, scope })
    UC->>TEN: companyIdForLocal(localId) más assertTenant → SD-A
    alt local de otra empresa
        UC-->>EDGE: TenantForbiddenError · 403
    else local propio
        UC->>DB: SELECT * FROM event WHERE local_id = ?
        DB-->>UC: eventos en cualquier estado
        UC-->>EDGE: Event[]
        EDGE-->>W: 200 OK · EventResponse[]
        note over UC, DB: A diferencia del listado público, aquí NO se filtra por estado:<br/>el tenant ve sus borradores, cancelados y finalizados.
        W->>W: tabla con búsqueda por nombre y filtro por estado
        W->>W: columna de ocupación calculada como ticketsSold sobre totalCapacity
        W-->>AD: agenda del local con sus acciones por fila
    end

    note over AD, DB: Fase 2 · Detalle administrativo de un evento
    AD->>W: entra a un evento concreto
    W->>EDGE: GET /api/v1/events/manage/{id} · Bearer
    EDGE->>UC: GetMyEventUseCase.execute({ eventId, scope })
    UC->>DB: SELECT * FROM event WHERE id = ?
    alt no existe
        UC-->>EDGE: EventNotFoundError · 404
    else existe
        UC->>TEN: companyIdForLocal(event.localId) más assertTenant
        alt evento de otra empresa
            UC-->>EDGE: TenantForbiddenError · 403
        else propio
            UC-->>EDGE: Event
            EDGE-->>W: 200 OK · EventResponse en cualquier estado
            W-->>AD: ficha administrativa con sus tipos de entrada
        end
    end
    note over EDGE, DB: La ruta manage existe precisamente porque GET /events/{slug} es<br/>pública y solo devuelve eventos publicados.
```

### SD-10 · Métricas del local

`GET /api/v1/events/stats/{localId}` · `@Roles('admin_local')` · `GetLocalStatsUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin de local
    participant PG as Dashboard del panel (RSC)
    participant EDGE as Edge API
    participant UC as GetLocalStatsUseCase
    participant TEN as EventTenantPort
    participant DB as PostgreSQL

    note over AD, PG: Fase 1 · Locales del actor
    AD->>PG: GET /panel/admin
    PG->>EDGE: GET /api/v1/locals/mine · Bearer
    alt la llamada falla
        EDGE-->>PG: error
        PG-->>AD: ErrorState del panel completo
        note over PG: Se distingue "sin locales" de "el API falló": un catch a lista vacía<br/>mostraría el estado vacío con el backend caído.
    else locales cargados
        EDGE-->>PG: 200 OK · LocalResponse[]

        note over PG, DB: Fase 2 · KPIs por local, en paralelo
        par por cada local del actor
            PG->>EDGE: GET /api/v1/events/stats/{localId} · Bearer
            EDGE->>UC: execute({ localId, scope })
            UC->>TEN: companyIdForLocal(localId) más assertTenant → SD-A
            UC->>DB: SELECT * FROM event WHERE local_id = ?
            DB-->>UC: eventos del local
            UC->>UC: cuenta eventos, publicados, y suma ticketsSold y checkinsCount
            note over UC: CQRS-lite: agrega los contadores denormalizados del evento<br/>en memoria, sin JOIN contra ticket ni qr_validation.
            UC-->>EDGE: LocalStats
            EDGE-->>PG: 200 OK · LocalStatsResponse
        end
        note over PG, EDGE: Una petición por local, con catch individual a null: un local que<br/>falle no tumba el dashboard, solo no suma. Ver §11.

        note over PG, AD: Fase 3 · Agregación en el cliente
        PG->>PG: suma los cuatro contadores de todos los locales
        PG-->>AD: tarjetas de locales, eventos, publicados, entradas vendidas y check-ins
    end
```

---

## 9. Bloque 4 · Estados del evento

### ED-1 · Máquina de estados del evento

Complemento a los diagramas de secuencia: el ciclo completo se lee mejor como máquina de estados.
Incluye los estados declarados en `EventStatus` que hoy **nada asigna**.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> draft : Event.create()
    draft --> published : publish()
    draft --> cancelled : cancel()
    published --> cancelled : cancel()
    cancelled --> cancelled : cancel() sin guarda
    scheduled --> published : publish()

    note right of scheduled
        Estado muerto: ningún código lo asigna.
        La UI lo filtra y permite publicar desde él.
    end note

    note right of published
        Único estado visible en el catálogo público.
        isOnSale() se deriva de aquí.
    end note

    note left of cancelled
        Terminal en la práctica. canPublish() bloquea
        volver a published desde cancelled o finished.
    end note

    finished --> [*]

    note left of finished
        Estado muerto: no hay job ni transición que
        cierre un evento cuya fecha ya pasó.
    end note
```

---

## 10. Trazabilidad: proceso → endpoint → código → estado

| Proceso | Endpoint(s) | Caso de uso / componente | Estado |
|---|---|---|---|
| Crear evento | `POST /events` | `CreateEventUseCase`, `flyer-storage` | ✅ Implementado |
| Editar evento | `PATCH /events/{id}` | `UpdateEventUseCase` | ✅ Implementado, incluye flyer y taxonomías |
| Publicar evento | `POST /events/{id}/publish` | `PublishEventUseCase` | ⚠️ `canPublish()` casi no valida |
| Cancelar evento | `POST /events/{id}/cancel` | `CancelEventUseCase` | ⚠️ El motivo se valida y se descarta, y nadie escucha el evento |
| Crear tipo de entrada | `POST /ticket-types` | `CreateTicketTypeUseCase` | ✅ Implementado |
| Editar tipo de entrada y stock | — | — | ❌ No existe ni en el API ni en el panel (ver SD-07b) |
| Pausar la venta de un tramo | — | — | ❌ `paused` y `sold_out` son estados muertos |
| Consumo del stock | — (interno al checkout) | `InventoryPort`, `CHECK sold <= stock` | ✅ Implementado con doble barrera |
| Agenda pública | `GET /events`, `/events/trending`, `/events/upcoming` | `ListEventsUseCase` y hermanos | ✅ Implementado con ISR |
| Agenda de administración | `GET /events/mine?localId=`, `GET /events/manage/{id}` | `ListMyEventsUseCase`, `GetMyEventUseCase` | ⚠️ Exige `localId`, no hay vista por empresa |
| Métricas del local | `GET /events/stats/{localId}` | `GetLocalStatsUseCase` | ⚠️ Una petición por local, agregación en el cliente |
| Estados del evento | — | `EventStatus`, `Event.canPublish()` | ⚠️ `scheduled` y `finished` sin uso |

---

## 11. Brechas y riesgos detectados al levantar los flujos

Hallazgos de la lectura del código, ordenados por impacto. No forman parte del pedido, pero
condicionan la fidelidad de los diagramas.

1. **No se puede tocar un tipo de entrada después de crearlo.** Solo existen `POST /ticket-types` y la
   lectura. No hay forma de corregir un precio mal puesto, ampliar el stock de un tramo que se agotó
   ni cortar la venta. Es el hueco funcional más grande del bloque de inventario, y la propia tabla
   del panel lo documenta en el código.
2. **`paused` y `sold_out` son estados muertos.** `TicketTypeStatus` los define y el checkout ya
   rechaza todo lo que no sea `active`, pero ningún código los asigna nunca. Agotar el stock deja
   `remaining` en cero sin cambiar el estado.
3. **La ventana de venta no se aplica.** `saleStartsAt` y `saleEndsAt` se persisten al crear el tramo,
   pero el checkout solo comprueba `status === 'active'`. Un tramo con venta programada para el
   próximo mes se puede comprar hoy.
4. **El aforo del evento no limita nada.** `Event.hasCapacityFor()` existe en el dominio y no se
   invoca desde ningún sitio, y `SaleEvent` ni siquiera expone `totalCapacity`. Un evento con aforo
   100 vende 500 si sus tramos suman 500. Hoy `totalCapacity` solo alimenta el porcentaje de ocupación
   de la ficha y de la tabla.
5. **El motivo de cancelación se pide, se valida y se tira.** `cancelEventSchema` exige `reason` de 3
   a 255 caracteres, el controller lo recibe en un parámetro sin usar y `CancelEventUseCase` ni
   siquiera lo acepta. No se persiste ni se comunica a nadie.
6. **`EventPublished` y `EventCancelled` no tienen suscriptores.** Cancelar un evento no avisa a quien
   ya compró, no genera reembolso y no invalida las entradas emitidas: quedan `valid` y pasarían el
   control de puerta.
7. **`canPublish()` casi no valida.** Solo bloquea `cancelled` y `finished`. Se puede publicar un
   evento sin ningún tipo de entrada, sin flyer y con fecha pasada, y quedará en el catálogo público.
8. **`scheduled` y `finished` nunca se asignan.** No hay job ni transición que cierre eventos cuya
   fecha ya pasó, así que el catálogo depende de que alguien cancele a mano.
9. **No hay agenda por empresa.** `GET /events/mine` exige `localId`: con varios locales hay que
   consultar uno por uno. El dashboard hace lo mismo con `GET /events/stats/{localId}` y suma en el
   cliente, así que el coste crece linealmente con el número de locales.
10. **Se pueden añadir tramos a un evento ya publicado y a la venta** sin ninguna comprobación de
    estado. Puede ser deliberado, pero conviene decidirlo explícitamente.

---

## 12. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§N). Toda desviación se registra
  como ADR en `docs/adr/`.
- Al cambiar un caso de uso de `apps/api/src/modules/events/`, el `InventoryPort` de `ticketing` o los
  componentes del panel de local, actualizar el diagrama correspondiente **en el mismo PR** y revisar
  la tabla del §10.
- Antes de mergear, ejecutar el comando de validación de §3.6: los 14 diagramas deben renderizar.
- Los diagramas nombran casos de uso, endpoints y columnas reales a propósito: un `grep` del nombre en
  el repo debe encontrar el código. Si no lo encuentra, el diagrama está desactualizado.
