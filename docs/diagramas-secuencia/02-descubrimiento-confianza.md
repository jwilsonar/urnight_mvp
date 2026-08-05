# Descubrimiento y confianza — Diagramas de secuencia y flujo de protocolo

**Serie:** [Diagramas de secuencia](./README.md) · **Dominios 2 y 7 del DER** — *Taxonomy & Catalogs* + *Trust* (§4.1 de `PROJECT_SPECS.md`)

> **Alcance.** Cinco procesos del dominio *Descubrimiento y confianza*, agrupados en cuatro bloques y
> representados con **12 diagramas de secuencia Mermaid** en formato *protocol data flow*: cada flecha
> lleva su método, ruta, código de estado y forma del payload; cada fase del pipeline va marcada con un
> banner. Reflejan el código real de `apps/api` (módulos `events`, `companies`, `catalog`, `trust`,
> `identity/favorites`) y `apps/web` (rutas de consumidor). Donde un bloque es maqueta se marca el
> estado y se indica qué falta.
>
> Mismo estándar de notación que `docs/diagramas-secuencia/01-identidad-acceso.md`.
> Fecha de levantamiento: 2026-07-28 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Proceso cubierto |
|---|---|---|
| SD-A | [Lectura pública con ISR](#sd-a--lectura-pública-con-isr) | sub-flujo compartido |
| SD-B | [Acción autenticada desde el cliente](#sd-b--acción-autenticada-desde-el-cliente) | sub-flujo compartido |
| SD-01 | [Listado de eventos con filtros](#sd-01--listado-de-eventos-con-filtros-y-paginación) | Descubrir, buscar y filtrar eventos |
| SD-02 | [Búsqueda global y sugerencias](#sd-02--búsqueda-global-y-sugerencias-en-vivo) | Descubrir, buscar y filtrar eventos |
| SD-03 | [Listado de locales por zona](#sd-03--listado-de-locales-y-filtro-por-zona) | Descubrir, buscar y filtrar |
| SD-04 | [Detalle de evento](#sd-04--detalle-de-evento) | Detalle de evento |
| SD-05 | [Detalle de local y contenido](#sd-05--detalle-de-local-galería-y-contenido) | Detalle de local y contenido |
| SD-06 | [Favoritos: marcar y quitar](#sd-06--favoritos-marcar-y-quitar) | Favoritos |
| SD-07 | [Guardados: lista enriquecida](#sd-07--guardados-lista-enriquecida) | Favoritos |
| SD-08 | [Reseñar una experiencia](#sd-08--reseñar-una-experiencia) | Reseñar una experiencia |
| SD-09 | [Reportar contenido o incidente](#sd-09--reportar-contenido-o-incidente) | Reportar contenido o incidente |
| SD-10 | [Resolución del reporte](#sd-10--resolución-del-reporte) | Reportar contenido o incidente |

---

## 2. Agrupación de los procesos

Los cinco procesos comparten dos caminos técnicos: **lectura pública cacheada** (todo el
descubrimiento) y **mutación autenticada desde el cliente** (favoritos, reseñas, reportes). Extraerlos
evita repetir el mismo tramo en diez diagramas.

| Bloque | Procesos | Razón de la agrupación |
|---|---|---|
| **0 · Sub-flujos compartidos** | — | Toda la exploración pasa por `apiFetch` con ISR y degradación controlada (SD-A). Toda acción de confianza pasa por token de sesión + React Query o `useTokenAction` (SD-B). |
| **1 · Descubrimiento** | Descubrir, buscar y filtrar eventos · (listado de locales) | Mismo patrón: filtros en la query string, Server Component con ISR, degradación a `EmptyState`. Se separan listado, búsqueda y locales porque cada uno tiene su propio contrato de filtros. |
| **2 · Fichas de detalle** | Detalle de evento · Detalle de local, favoritos y contenido | Ambas fichas hacen fan-out en paralelo sobre datos secundarios y montan las mismas acciones de cliente (favorito, reporte). Favoritos se separa en dos diagramas: el toggle en la ficha y la vista Guardados, que tienen backends distintos. |
| **3 · Confianza** | Reseñar una experiencia · Reportar contenido o incidente | Módulo `trust`. Reseñar exige elegibilidad verificada por entrada usada; reportar no. Se añade SD-10 porque un reporte sin resolución no cierra el proceso. |

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
9. **Infraestructura con su comando real**, no con una paráfrasis: `SELECT ... WHERE status = 'published'`,
   `DELETE FROM ...`. Hace el diagrama auditable
   contra los adapters Drizzle y Redis.
10. **Placeholders entre llaves**, nunca entre `<` `>` (Mermaid los interpreta como HTML): `{slug}`.

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
  -i docs/diagramas-secuencia/02-descubrimiento-confianza.md \
  -o /tmp/02-descubrimiento-confianza.md
```

También sirven mermaid.live y la extensión *Markdown Preview Mermaid Support* de VS Code. GitHub
renderiza estos bloques de forma nativa.

---

## 4. Catálogo de participantes

| Alias | Componente real | Archivo |
|---|---|---|
| `U` | Persona usuaria (visitante o autenticada) | — |
| `PG` | Server Component de una ruta de consumidor | `apps/web/app/(consumer)/**` |
| `FET` | Fetchers públicos tipados | `apps/web/lib/api/catalog.ts`, `trust.ts`, `favorites.ts` |
| `CACHE` | Data Cache de Next (ISR por `next.revalidate`) | — |
| `RQ` | React Query (`queryKeys.favorites`) | `apps/web/lib/api/query-keys.ts` |
| `ACT` | `useTokenAction` — token de sesión + toasts + manejo de 401 | `apps/web/lib/hooks/use-token-action.tsx` |
| `EDGE` | Pipeline global del API: `RateLimit → Auth → Roles` + `ZodValidationPipe` | `apps/api/src/edge/**` |
| `UC` | Caso de uso (capa aplicación) | `apps/api/src/modules/**/application/use-cases/**` |
| `REPO` | Adapter Drizzle del repositorio | `apps/api/src/modules/**/infrastructure/persistence/**` |
| `ATT` | `AttendancePort` — elegibilidad por entrada usada | `.../trust/infrastructure/persistence/drizzle-attendance.adapter.ts` |
| `TR` | `ResourceTenantResolver` — empresa dueña de un recurso | `apps/api/src/shared/tenant/resource-tenant.port.ts` |
| `ST` | `StoragePort` — resuelve keys de S3 a URL pública | `apps/api/src/shared/adapters/storage/**` |
| `DB` | PostgreSQL vía Drizzle | `packages/db/src/schema/**` |

### TTL de caché por recurso

| Recurso | `revalidate` | Motivo |
|---|---|---|
| `/zones`, `/music-genres`, `/tags` | 300 s | Taxonomía casi inmutable |
| `/locals`, `/events`, fichas | 60 s | Catálogo, cambia con publicaciones |
| `/events/{id}/ticket-types`, `/reviews` | 30 s | Inventario y contenido social, sensibles a frescura |
| Página `/events/{slug}` | 30 s | Alineada con el TTL de su dato más volátil |

---

## 5. Bloque 0 · Sub-flujos compartidos

### SD-A · Lectura pública con ISR

Camino común de todo el descubrimiento: los Server Components no hablan con la base, hablan con
`apiFetch`, y el Data Cache de Next absorbe la mayoría de las visitas.

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant PG as Server Component
    participant FET as lib/api (fetchers)
    participant CACHE as Data Cache de Next
    participant EDGE as Edge API
    participant UC as Caso de uso de lectura
    participant DB as PostgreSQL

    note over U, CACHE: Fase 1 · Render con ISR
    U->>PG: GET /events, /locals, /search o una ficha
    PG->>FET: getEvents, getLocals, getReviews, getLocalImages...
    FET->>CACHE: apiFetch(path, { next: { revalidate: N } })
    alt entrada fresca en caché
        CACHE-->>FET: payload cacheado, sin salir a la red
    else caché vencida o ausente
        note over EDGE, DB: Fase 2 · Consulta pública, sin sesión
        CACHE->>EDGE: GET /api/v1/{recurso} · Accept application/json
        EDGE->>EDGE: RateLimitGuard 100/min por IP → AuthGuard @Public → ZodValidationPipe
        EDGE->>UC: execute(filtros ya validados)
        UC->>DB: SELECT ... WHERE estado publicado o visible
        DB-->>UC: rows
        UC-->>EDGE: entidades de dominio
        EDGE-->>CACHE: 200 OK · DTO con las keys de storage ya resueltas a URL
        CACHE->>CACHE: almacena con TTL revalidate
        CACHE-->>FET: payload
    end

    note over FET, U: Fase 3 · Degradación controlada
    alt respuesta 2xx
        FET-->>PG: DTO tipado
        PG-->>U: HTML con datos
    else fallo de red, timeout de 15 s o 5xx
        FET-->>PG: throw ApiError o error de red
        PG->>PG: catch en el punto de llamada
        note over PG: Fuente principal con catch a null, para distinguir "falló" de "vacío".<br/>Fuentes secundarias con catch a lista vacía, para no tumbar la página.
        PG-->>U: EmptyState de error o sección vacía, nunca pantalla rota
    end
```

### SD-B · Acción autenticada desde el cliente

Camino común de favoritos, reseñas y reportes: componente cliente, token de la sesión, mutación,
invalidación de caché y traducción del error.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario autenticado
    participant CMP as Componente cliente
    participant SESS as useSession (Auth.js)
    participant ACT as useTokenAction o React Query
    participant EDGE as Edge API
    participant UC as Caso de uso
    participant DB as PostgreSQL

    note over CMP, SESS: Fase 1 · Obtención del token de acceso
    U->>CMP: acción (guardar, reseñar, reportar)
    CMP->>SESS: session.accessToken
    alt sin sesión o sin token
        SESS-->>CMP: undefined
        CMP-->>U: toast de sesión expirada, o redirección a /login?callbackUrl={ruta}
    else token disponible
        SESS-->>CMP: accessToken

        note over ACT, DB: Fase 2 · Mutación autenticada
        CMP->>ACT: run del fetcher con el token
        ACT->>EDGE: POST o DELETE /api/v1/... · Authorization Bearer {accessToken}
        EDGE->>EDGE: RateLimitGuard → AuthGuard (JWT HS256) → RolesGuard
        EDGE->>UC: execute({ userId, dto })
        UC->>DB: INSERT, UPDATE o DELETE
        DB-->>UC: filas afectadas
        UC-->>EDGE: entidad de dominio
        EDGE-->>ACT: 201, 200 o 204 · DTO o sin cuerpo

        note over ACT, U: Fase 3 · Feedback y refresco de caché
        alt éxito
            ACT-->>CMP: resultado
            CMP->>CMP: invalidateQueries o router.refresh()
            CMP-->>U: toast de éxito
        else 401 sesión inutilizable
            ACT->>ACT: handleSessionExpired()
            ACT-->>U: signOut y /login?error=SessionExpired
        else error de dominio 4xx
            ACT-->>U: toast con getErrorMessage(error) desde el problem+json
        end
    end
```

---

## 6. Bloque 1 · Descubrimiento

### SD-01 · Listado de eventos con filtros y paginación

`GET /api/v1/events` · público · `ListEventsUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant PG as Ruta /events (RSC, revalidate 60)
    participant FET as lib/api/catalog.ts
    participant EDGE as Edge API
    participant UC as ListEventsUseCase
    participant REPO as DrizzleEventRepository
    participant DB as PostgreSQL

    note over U, PG: Fase 1 · Los filtros son estado de URL
    U->>PG: GET /events?q&zoneId&genreId&tagId&page
    PG->>PG: page normalizada a entero mayor o igual que 1 · offset = (page - 1) * 24
    note over PG: Los chips de género son enlaces, no estado de cliente:<br/>la página sigue siendo estática con ISR y funciona sin JavaScript.

    note over PG, FET: Fase 2 · Fan-out de lecturas
    par Listado paginado
        PG->>FET: getEvents({ q, zoneId, genreId, tagId, limit 25, offset })
    and Catálogo de géneros
        PG->>FET: getMusicGenres()
    end
    note over PG: Se piden PAGE_SIZE + 1 = 25 filas para saber si hay página siguiente<br/>sin necesidad de un envelope con el total.
    FET->>EDGE: GET /api/v1/events?q=...&limit=25&offset=0
    EDGE->>EDGE: @Public → ZodValidationPipe(eventListQuerySchema) → toEventFilter, fechas a Date
    EDGE->>UC: execute(EventListFilter)
    UC->>REPO: listPublished(filter)

    note over REPO, DB: Fase 3 · Consulta con filtros compuestos
    REPO->>DB: SELECT * FROM event WHERE status = 'published'
    opt zoneId
        REPO->>DB: AND local_id IN (SELECT id FROM local WHERE zone_id = ?)
    end
    opt genreId o tagId
        REPO->>DB: AND id IN (SELECT event_id FROM event_genre o event_tag WHERE ...)
    end
    opt q
        REPO->>REPO: nq = normalizeSearch(q), quita acentos, espacios y mayúsculas
        REPO->>DB: AND (name LIKE %nq% OR description LIKE %nq% OR customTags jsonb OR nombre de tag OR nombre de género)
        note over REPO, DB: Búsqueda tolerante (#3): "DJ Peligro" se encuentra<br/>escribiendo "djpeligro", "dj" o "DJ".
    end
    opt from o to
        REPO->>DB: AND starts_at entre las fechas indicadas
    end
    REPO->>DB: ORDER BY starts_at DESC LIMIT 25 OFFSET ?
    DB-->>REPO: rows
    REPO-->>UC: Event[]
    UC-->>EDGE: Event[]
    EDGE-->>FET: 200 OK · EventResponse[]
    FET-->>PG: lista o null si falló

    note over PG, U: Fase 4 · Render y paginación
    PG->>PG: hasNext si llegaron más de 24 · visible = las primeras 24
    alt el API falló (catch a null)
        PG-->>U: EmptyState "no pudimos cargar"
    else lista vacía
        PG-->>U: EmptyState con CTA a /locals
    else hay resultados
        PG-->>U: grid de EventCard + enlaces anterior y siguiente que preservan los filtros
    end
```

### SD-02 · Búsqueda global y sugerencias en vivo

`SearchSuggest` en el header (cliente) + ruta `/search` (Server Component).

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant SS as SearchSuggest (header, cliente)
    participant FET as lib/api/catalog.ts
    participant EDGE as Edge API
    participant PG as Ruta /search (RSC, revalidate 60)

    note over U, EDGE: Fase 1 · Sugerencias en vivo con debounce
    U->>SS: escribe el término
    alt menos de 2 caracteres
        SS->>SS: limpia resultados y no consulta
    else 2 caracteres o más
        SS->>SS: debounce de 300 ms
        par Eventos
            SS->>FET: getEvents({ q })
        and Locales
            SS->>FET: getLocals({ q })
        end
        FET->>EDGE: GET /api/v1/events?q= y GET /api/v1/locals?q=
        EDGE-->>FET: 200 OK · EventResponse[] y LocalResponse[]
        FET-->>SS: resultados
        SS->>SS: recorta a 4 eventos y 3 locales
        note over SS, FET: En cliente el hint next.revalidate no aplica: la caché la decide<br/>el navegador. Lo que acota el tráfico es el debounce.
        alt hay coincidencias
            SS-->>U: panel con enlaces directos a /events/{slug} y /locals/{slug}
        else sin coincidencias
            SS-->>U: aviso + acción "buscar igualmente"
        end
    end

    note over U, PG: Fase 2 · Búsqueda global
    U->>SS: pulsa Enter o "Ver todos"
    SS->>PG: router.push a /search?q={term}
    alt término vacío
        PG-->>U: EmptyState inicial, sin consultar el API
    else con término
        par Eventos
            PG->>FET: getEvents({ q }) con catch a null
        and Locales
            PG->>FET: getLocals({ q }) con catch a null
        end
        FET-->>PG: resultados o null por fuente
        note over PG: catch a null y no a lista vacía: un fallo del API no puede<br/>presentarse al usuario como "sin resultados".
        alt ambas fuentes fallaron
            PG-->>U: ErrorState
        else sin resultados
            PG-->>U: EmptyState con el término y acción para limpiar
        else con resultados
            PG-->>U: secciones Eventos y Locales, cada una con su contador
        end
    end
```

### SD-03 · Listado de locales y filtro por zona

`GET /api/v1/locals` · público · `ListLocalsUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant ZF as ZoneFilter (cliente)
    participant PG as Ruta /locals (RSC, revalidate 60)
    participant FET as lib/api/catalog.ts
    participant EDGE as Edge API
    participant UC as ListLocalsUseCase
    participant ST as StoragePort
    participant DB as PostgreSQL

    note over U, DB: Fase 1 · Carga inicial en paralelo
    U->>PG: GET /locals?zoneId&q
    par Catálogo de zonas
        PG->>FET: getZones() — revalidate 300
    and Locales visibles
        PG->>FET: getLocals({ zoneId, q }) — revalidate 60
    end
    FET->>EDGE: GET /api/v1/zones y GET /api/v1/locals?zoneId=...&q=...
    EDGE->>EDGE: @Public → ZodValidationPipe(localListQuerySchema)
    EDGE->>UC: execute(LocalListFilter)
    UC->>DB: SELECT * FROM local WHERE estado visible AND filtros de zona, tipo, género o etiqueta
    DB-->>UC: rows
    UC-->>EDGE: Local[]

    note over EDGE, ST: Fase 2 · Resolución de portadas en la capa HTTP
    EDGE->>ST: resolveUrl(mainImageKey) por cada local
    ST-->>EDGE: URL absoluta del entorno actual
    note over EDGE, ST: En la base se persiste la KEY de S3, nunca la URL: los datos<br/>quedan independientes del entorno y del CDN.
    EDGE-->>FET: 200 OK · LocalResponse[] con mainImageUrl resuelto
    FET-->>PG: zonas y locales

    note over PG, U: Fase 3 · Render y cambio de filtro
    alt getLocals falló (catch a null)
        PG-->>U: EmptyState de error
    else sin locales
        PG-->>U: EmptyState con acción para limpiar el filtro
    else con locales
        PG-->>U: grid de LocalCard + bloque de afiliación
    end
    U->>ZF: cambia la zona en el selector
    ZF->>ZF: compone URLSearchParams, set o delete de zoneId
    ZF->>PG: router.push a /locals?zoneId={id}
    PG-->>U: nuevo render servido desde ISR
```

---

## 7. Bloque 2 · Fichas de detalle

### SD-04 · Detalle de evento

`GET /api/v1/events/{slug}` · público · `GetEventUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant PG as Ruta /events/{slug} (RSC, revalidate 30)
    participant FET as lib/api catalog y trust
    participant EDGE as Edge API
    participant DB as PostgreSQL
    participant SB as Acciones de sidebar (cliente)

    note over U, DB: Fase 1 · Resolución del evento
    U->>PG: GET /events/{slug}
    PG->>FET: getEventBySlug(slug)
    FET->>EDGE: GET /api/v1/events/{slug}
    EDGE->>DB: SELECT * FROM event WHERE slug = ?
    alt no existe
        DB-->>EDGE: null
        EDGE-->>FET: 404 · problem+json { code events/event_not_found }
        FET-->>PG: ApiError 404
        PG->>PG: notFound() y render de la página 404
    else existe
        DB-->>EDGE: row + géneros + etiquetas asociados
        EDGE-->>FET: 200 OK · EventResponse
        note over PG, FET: generateMetadata repite el mismo GET, pero Next memoiza la<br/>petición dentro del render, así que sale a la red una sola vez.

        note over PG, FET: Fase 2 · Fan-out de datos secundarios
        par Entradas
            PG->>FET: getEventTicketTypes(event.id) — revalidate 30
        and Reseñas
            PG->>FET: getReviews({ eventId }) — revalidate 30
        and Local anfitrión
            PG->>FET: getLocals()
        end
        FET-->>PG: tres resultados, cada uno con catch a lista vacía
        PG->>PG: busca en la lista de locales el que coincide con event.localId
        note over PG, FET: Deuda D1: EventResponse no expone localName ni localSlug, y no<br/>existe un GET de local por id, así que se descarga TODO el catálogo<br/>de locales para resolver un nombre y un enlace.

        note over PG, U: Fase 3 · Composición de la ficha
        PG->>PG: porcentaje vendido, agotado, y precio mínimo entre los tipos no pausados
        PG-->>U: hero con flyer, badges de venta, edad mínima, casi lleno o agotado
        PG-->>U: datos de fecha y horario, descripción, card del local y lista de reseñas
        PG-->>SB: monta FavoriteButton y ReportDialog con targetType event
        note over SB: Acciones autenticadas de la sidebar: ver SD-06 y SD-09.<br/>El flujo de compra queda fuera del alcance de este documento.
    end
```

### SD-05 · Detalle de local, galería y contenido

`GET /api/v1/locals/{slug}` + `GET /api/v1/locals/{id}/images` · públicos

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant PG as Ruta /locals/{slug} (RSC, revalidate 60)
    participant FET as lib/api catalog y trust
    participant EDGE as Edge API
    participant ST as StoragePort
    participant DB as PostgreSQL
    participant SB as Acciones de ficha (cliente)

    note over U, DB: Fase 1 · Resolución del local
    U->>PG: GET /locals/{slug}
    PG->>FET: getLocalBySlug(slug)
    FET->>EDGE: GET /api/v1/locals/{slug}
    EDGE->>DB: SELECT * FROM local WHERE slug = ?
    alt no existe
        DB-->>EDGE: null
        EDGE-->>FET: 404 · { code companies/local_not_found }
        PG->>PG: notFound()
    else existe
        DB-->>EDGE: row
        EDGE->>ST: resolveUrl(mainImageKey)
        ST-->>EDGE: URL de portada
        EDGE-->>PG: 200 OK · LocalResponse

        note over PG, ST: Fase 2 · Contenido de la ficha en paralelo
        par Cartelera del local
            PG->>FET: getEvents({ localId })
        and Reseñas del local
            PG->>FET: getReviews({ localId })
        and Galería
            PG->>FET: getLocalImages(local.id)
        end
        FET->>EDGE: GET /api/v1/locals/{id}/images — público, ordenado por sort_order
        EDGE->>ST: resolveUrl(storageKey) por imagen
        ST-->>EDGE: URLs absolutas
        EDGE-->>FET: 200 OK · LocalImageResponse[]
        FET-->>PG: eventos, reseñas e imágenes, cada bloque con catch a lista vacía
        note over PG: El local ya cargó: si un bloque secundario falla, esa sección queda<br/>vacía en vez de propagar al error boundary de la ruta.

        note over PG, U: Fase 3 · Composición y contenido de demo
        PG->>PG: hay coordenadas, arma el enlace de Google Maps y consulta el aforo simulado
        PG-->>U: galería, sello de verificado, descripción, cartelera y reseñas
        PG-->>U: sidebar con mapa, cómo llegar, reserva de mesa y carta del local
        note over PG, U: Aforo en vivo, reserva de mesa y carta in-venue son maquetas de<br/>lib/mock, marcadas en la interfaz con el badge "demo".
        PG-->>SB: monta FavoriteButton y ReportDialog con targetType local
    end
```

### SD-06 · Favoritos: marcar y quitar

`GET`, `POST /api/v1/me/favorites` · `DELETE /api/v1/me/favorites/{targetType}/{targetId}` · autenticado

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant FB as FavoriteButton (cliente)
    participant RQ as React Query · queryKeys.favorites
    participant EDGE as Edge API
    participant UC as Add o RemoveFavoriteUseCase
    participant DB as PostgreSQL

    note over FB, RQ: Fase 1 · Estado compartido, una sola query por página
    alt sesión no autenticada
        FB-->>U: el botón no se renderiza
    else autenticado
        FB->>RQ: useQuery(queryKeys.favorites), habilitada solo con token
        RQ->>EDGE: GET /api/v1/me/favorites · Bearer
        EDGE-->>RQ: 200 OK · FavoriteResponse[]
        RQ-->>FB: lista de favoritos
        FB->>FB: marcado si la lista contiene ese targetType y targetId
        note over FB, RQ: Todos los botones de la página comparten la MISMA query:<br/>el estado sale del caché, sin prop initialFavorited por tarjeta.
        note over FB: Mientras la lista carga el botón queda deshabilitado: togglear<br/>sobre un estado no confiable dejaría el corazón invertido.

        note over U, DB: Fase 2 · Toggle con actualización optimista
        U->>FB: pulsa el corazón
        FB->>FB: onMutate pinta el estado optimista al instante
        alt marcar
            FB->>EDGE: POST /api/v1/me/favorites · Bearer · { targetType, targetId }
            EDGE->>UC: AddFavoriteUseCase
            UC->>DB: SELECT 1 FROM user_favorite WHERE user_id, target_type y target_id
            alt ya existía
                DB-->>UC: exists
                UC-->>EDGE: FavoriteAlreadyExistsError
                EDGE-->>FB: 409 · { code identity/favorite_already_exists }
            else nuevo
                UC->>DB: INSERT INTO user_favorite
                DB-->>UC: 1 row
                UC-->>EDGE: Favorite
                EDGE-->>FB: 201 Created · FavoriteResponse con target en null
                note over EDGE: El POST no enriquece el target: eso lo resuelve el GET<br/>de la vista Guardados (SD-07).
            end
        else quitar
            FB->>EDGE: DELETE /api/v1/me/favorites/{targetType}/{targetId} · Bearer
            EDGE->>EDGE: targetType debe ser local o event, si no 400 Bad Request
            EDGE->>UC: RemoveFavoriteUseCase
            UC->>DB: DELETE FROM user_favorite WHERE user_id, target_type y target_id
            alt no había fila
                DB-->>UC: 0 rows
                UC-->>EDGE: FavoriteNotFoundError
                EDGE-->>FB: 404 · { code identity/favorite_not_found }
            else eliminado
                DB-->>UC: 1 row
                EDGE-->>FB: 204 No Content
            end
        end

        note over FB, RQ: Fase 3 · Reconciliación con el servidor
        alt éxito
            FB->>RQ: invalidateQueries(queryKeys.favorites)
            FB->>FB: descarta el estado optimista
            FB-->>U: toast "guardado" o "quitado"
        else error
            FB->>FB: revierte el estado optimista
            FB->>RQ: invalidateQueries igualmente
            note over FB, RQ: Un 409 significa que el caché local iba desfasado. Refrescar<br/>corrige el corazón apagado sobre algo que ya estaba guardado.
            FB-->>U: toast de error
        end
    end
```

### SD-07 · Guardados: lista enriquecida

`GET /api/v1/me/favorites` · `ListEnrichedFavoritesUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant FL as FavoritesList en /account/guardados
    participant EDGE as Edge API
    participant UC as ListEnrichedFavoritesUseCase
    participant REPO as DrizzleUserFavoriteRepository
    participant ST as StoragePort
    participant DB as PostgreSQL

    note over U, DB: Fase 1 · Lectura con limpieza perezosa
    U->>FL: GET /account/guardados
    FL->>EDGE: GET /api/v1/me/favorites · Bearer
    EDGE->>UC: execute({ userId })
    UC->>REPO: removeStaleEventFavorites(userId)
    REPO->>DB: DELETE de los favoritos de eventos cancelados o ya pasados
    DB-->>REPO: n filas eliminadas
    note over UC, DB: Limpieza perezosa en la lectura (§4.3): la lista nunca muestra<br/>eventos muertos y no hace falta un job de mantenimiento.
    UC->>REPO: listEnrichedByUser(userId)
    REPO->>DB: SELECT del favorito con JOIN a local o event para nombre, slug, portada, fecha y estado
    DB-->>REPO: rows enriquecidas
    REPO-->>UC: EnrichedFavorite[]

    note over EDGE, ST: Fase 2 · Resolución de portadas
    UC-->>EDGE: EnrichedFavorite[]
    EDGE->>ST: resolveUrl(imageRef) por elemento
    ST-->>EDGE: URLs absolutas
    EDGE-->>FL: 200 OK · FavoriteResponse[] con el target resuelto

    note over FL, U: Fase 3 · Render por estado
    alt error de la query
        FL-->>U: ErrorState con acción de reintento
        note over FL: Se distingue el fallo del vacío (M9): un error del API<br/>no puede leerse como "aún no tienes favoritos".
    else lista vacía
        FL-->>U: EmptyState con CTA a /events o /locals
    else con elementos
        FL->>FL: filtra por pestaña, local o evento, si la vista lo pide
        alt el target se resolvió
            FL-->>U: tarjeta enlazada a /locals/{slug} o /events/{slug}
        else favorito huérfano, sin target
            FL-->>U: tarjeta sin enlace
        end
    end
```

---

## 8. Bloque 3 · Confianza

### SD-08 · Reseñar una experiencia

`POST /api/v1/reviews` · **autenticado** · `CreateReviewUseCase`.
Invariante del dominio: solo reseña quien compró y **asistió** — entrada en estado `used`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant TI as AccountTicketItem en /account/tickets
    participant RF as ReviewForm
    participant ACT as useTokenAction
    participant EDGE as Edge API
    participant UC as CreateReviewUseCase
    participant ATT as AttendancePort
    participant DB as PostgreSQL

    note over U, RF: Fase 1 · Puerta de entrada desde la billetera
    U->>TI: abre Mis entradas
    alt la entrada no está en estado used
        TI-->>U: solo la tarjeta de la entrada, sin acción de reseña
    else entrada usada
        TI-->>U: botón "Reseñar" que abre el diálogo
        U->>RF: elige de 1 a 5 estrellas y escribe un comentario opcional
        RF->>RF: sin estrellas no envía, muestra toast de error

        note over ACT, DB: Fase 2 · Envío autenticado y verificación de elegibilidad
        RF->>ACT: run del fetcher createReview con el token
        ACT->>EDGE: POST /api/v1/reviews · Bearer · { targetType, eventId, ticketId, rating, comment }
        EDGE->>EDGE: AuthGuard, la ruta NO es pública → ZodValidationPipe(createReviewSchema)
        EDGE->>UC: execute({ userId, dto })
        UC->>ATT: getUsedTicketContext(userId, ticketId)
        ATT->>DB: SELECT event.id y event.local_id desde ticket con JOIN a order_item, order y event, filtrando por ticket.id, order.user_id y ticket.status = 'used'
        DB-->>ATT: row o null
        ATT-->>UC: AttendanceContext o null
        alt sin entrada usada de ese usuario
            UC-->>EDGE: ReviewNotEligibleError
            EDGE-->>ACT: 403 · { code trust/review_not_eligible }
        else entrada válida
            UC->>UC: comprueba que el target coincida con el contexto del ticket
            note over UC: targetType event debe casar con el eventId del ticket, y local con su<br/>localId. Sin esa comprobación se podría reseñar un sitio donde nunca se estuvo.
            alt el target no coincide
                UC-->>EDGE: ReviewNotEligibleError
                EDGE-->>ACT: 403 · { code trust/review_not_eligible }
            else coincide
                UC->>UC: Review.create con isVerified true y status published
                UC->>DB: INSERT INTO review
                DB-->>UC: 1 row
                UC-->>EDGE: Review
                EDGE-->>ACT: 201 Created · ReviewResponse
            end
        end

        note over ACT, U: Fase 3 · Feedback y refresco
        alt éxito
            ACT-->>RF: ReviewResponse
            RF->>RF: cierra el diálogo y llama a router.refresh()
            RF-->>U: toast de éxito
            note over RF: getReviews está cacheado 30 s, así que la reseña puede tardar<br/>ese tiempo en aparecer en la ficha pública pese al refresh.
        else 401
            ACT->>ACT: handleSessionExpired() y re-login
        else 403 u otro error de dominio
            ACT-->>U: toast con el mensaje traducido del problem+json
        end
    end
```

**Dónde se lee la reseña.** `ReviewList` recibe el array ya resuelto en servidor (SD-04 y SD-05),
calcula el promedio en cliente y marca con sello las reseñas `isVerified`. La lectura es pública:
`GET /api/v1/reviews?localId=` o `?eventId=`.

### SD-09 · Reportar contenido o incidente

`POST /api/v1/reports` · **autenticado** · `CreateReportUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant RD as ReportDialog en la ficha
    participant ACT as useTokenAction
    participant EDGE as Edge API
    participant UC as CreateReportUseCase
    participant DB as PostgreSQL

    note over U, RD: Fase 1 · Requiere sesión
    U->>RD: pulsa "Reportar"
    alt sin sesión
        RD-->>U: redirección a /login?callbackUrl={ruta actual}
        note over RD: El callbackUrl devuelve a la ficha que se quería reportar,<br/>no al home.
    else con sesión
        RD-->>U: diálogo con motivo y comentario
        U->>RD: elige motivo entre cancelled, wrong_price, wrong_location, unsafe u other
        RD->>RD: si el motivo es other exige comentario, marca el error y enfoca el campo

        note over ACT, DB: Fase 2 · Alta del reporte
        RD->>ACT: run del fetcher createReport con el token
        ACT->>EDGE: POST /api/v1/reports · Bearer · { targetType, localId o eventId, reason, comment, severity }
        EDGE->>EDGE: AuthGuard → ZodValidationPipe(createReportSchema)
        EDGE->>UC: execute({ reporterUserId, dto })
        UC->>UC: Report.file, status open, sin resolutionNote ni resolvedBy
        UC->>DB: INSERT INTO report
        DB-->>UC: 1 row
        UC-->>EDGE: Report
        EDGE-->>ACT: 201 Created · ReportResponse { id, status open }

        note over ACT, U: Fase 3 · Cierre en la interfaz
        ACT-->>RD: ReportResponse
        RD->>RD: cierra el diálogo y limpia el formulario
        RD-->>U: toast "reporte enviado"
        note over RD, EDGE: La interfaz envía siempre severity low, aunque el contrato<br/>admite low, medium y high.
    end
```

### SD-10 · Resolución del reporte

`POST /api/v1/reports/{id}/resolve` · `@Roles('admin_local')` · `ResolveReportUseCase`

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin local o super admin
    participant PNL as Panel
    participant EDGE as Edge API
    participant UC as ResolveReportUseCase
    participant TR as ResourceTenantResolver
    participant DB as PostgreSQL

    note over AD, PNL: Fase 1 · Bandeja de reportes
    AD->>PNL: abre la bandeja de reclamaciones
    note over PNL, EDGE: Brecha: no existe un GET /reports en el API. La bandeja del panel<br/>se alimenta de lib/mock/reclamaciones. Sin listado, un admin no puede<br/>descubrir por API los reportes abiertos de su empresa.

    note over EDGE, DB: Fase 2 · Resolución con aislamiento multi-tenant
    PNL->>EDGE: POST /api/v1/reports/{id}/resolve · Bearer · { resolutionNote }
    EDGE->>EDGE: AuthGuard → RolesGuard @Roles('admin_local'), super_admin pasa siempre
    EDGE->>UC: execute({ reportId, resolvedBy, note, scope })
    UC->>DB: SELECT * FROM report WHERE id = ?
    alt no existe
        DB-->>UC: null
        UC-->>EDGE: ReportNotFoundError
        EDGE-->>PNL: 404 · { code trust/report_not_found }
    else existe
        DB-->>UC: row
        alt el reporte apunta a un local
            UC->>TR: companyIdForLocal(localId)
        else apunta a un evento
            UC->>TR: companyIdForEvent(eventId)
        end
        TR->>DB: SELECT company_id del recurso reportado
        DB-->>TR: companyId
        TR-->>UC: companyId
        UC->>UC: assertTenant(scope, companyId)
        note over UC: Solo el dueño del local o evento reportado puede resolverlo.<br/>super_admin ve todo, un admin de otra empresa recibe 403.
        alt el recurso es de otra empresa
            UC-->>EDGE: TenantForbiddenError
            EDGE-->>PNL: 403 · problem+json
        else scope correcto
            UC->>UC: report.resolve(resolvedBy, note), status resolved y resolvedAt ahora
            UC->>DB: UPDATE report SET status, resolution_note, resolved_by y resolved_at
            DB-->>UC: 1 row
            UC-->>EDGE: Report
            EDGE-->>PNL: 200 OK · ReportResponse { status resolved }
            PNL-->>AD: reporte cerrado en la bandeja
        end
    end
```

---

## 9. Trazabilidad: proceso → endpoint → código → estado

| Proceso | Endpoint(s) | Caso de uso / componente | Estado |
|---|---|---|---|
| Descubrir y filtrar eventos | `GET /events`, `GET /events/trending`, `GET /events/upcoming` | `ListEventsUseCase`, `ListTrendingEventsUseCase`, `ListUpcomingEventsUseCase` | ✅ Implementado (paginación por `limit`/`offset`) |
| Buscar | `GET /events?q=`, `GET /locals?q=` | `SearchSuggest`, ruta `/search`, `normalizeSearch` en el repositorio | ✅ Implementado |
| Taxonomía y filtros | `GET /zones`, `/music-genres`, `/tags`, `/local-types` | `ListZonesUseCase`, `ListTaxonomyUseCase` | ✅ Implementado |
| Listado de locales | `GET /locals` | `ListLocalsUseCase` | ⚠️ Sin paginación en el contrato |
| Detalle de evento | `GET /events/{slug}`, `GET /events/{id}/ticket-types` | `GetEventUseCase`, `ListTicketTypesUseCase` | ⚠️ Resuelve el local listando todo el catálogo (deuda D1) |
| Detalle de local y contenido | `GET /locals/{slug}`, `GET /locals/{id}/images` | `GetLocalUseCase`, `ListLocalImagesUseCase` | ✅ Implementado · aforo, reserva y carta son demo |
| Favoritos | `GET`/`POST /me/favorites`, `DELETE /me/favorites/{type}/{id}` | `AddFavoriteUseCase`, `RemoveFavoriteUseCase`, `ListEnrichedFavoritesUseCase` | ✅ Implementado |
| Reseñar | `POST /reviews`, `GET /reviews` | `CreateReviewUseCase`, `ListReviewsUseCase`, `AttendancePort` | ⚠️ Backend admite reseñar locales, la UI solo eventos |
| Reportar | `POST /reports` | `CreateReportUseCase` | ✅ Implementado · `severity` fijo desde la UI |
| Resolver reporte | `POST /reports/{id}/resolve` | `ResolveReportUseCase`, `ResourceTenantResolver` | ⚠️ Sin endpoint de listado, la bandeja del panel es mock |

---

## 10. Brechas y riesgos detectados al levantar los flujos

Hallazgos de la lectura del código, ordenados por impacto. No forman parte del pedido, pero
condicionan la fidelidad de los diagramas.

1. **La ficha de evento descarga todo el catálogo de locales** para mostrar un nombre y un enlace
   (deuda D1, anotada en el propio código). El coste crece linealmente con el catálogo y afecta a cada
   render ISR. *Arreglo:* embeber `localName` y `localSlug` en `EventResponse`, o exponer un `GET` de
   local por id.
2. **No existe `GET /reports`.** Un reporte se puede crear y resolver, pero no listar: la bandeja del
   panel se alimenta de `lib/mock/reclamaciones`. El ciclo de moderación no cierra por API.
3. **El listado de locales no tiene paginación.** `localListQuerySchema` no admite `limit` ni
   `offset`, a diferencia de eventos. La búsqueda global y la ficha de evento traen la lista completa.
4. **La UI solo permite reseñar eventos.** `CreateReviewUseCase` y el contrato soportan
   `targetType: 'local'`, pero `ReviewForm` fija `'event'`. Las reseñas de local existen en el modelo
   y nunca se crean desde el producto.
5. **Una reseña recién creada puede tardar hasta 30 s en verse.** `router.refresh()` re-ejecuta el
   Server Component, pero `getReviews` sigue sirviendo la entrada cacheada. *Arreglo:* `revalidateTag`
   sobre las reseñas del target al crear.
6. **`severity` siempre viaja como `low`** desde `ReportDialog`, aunque el contrato acepta
   `medium` y `high`. Un incidente de seguridad entra con la misma prioridad que un precio erróneo.
7. **El listado público ordena por `starts_at DESC`**, de modo que los eventos más lejanos aparecen
   primero. Conviene confirmar si es lo esperado para una cartelera o si debería ser ascendente por
   proximidad.
8. **Contenido de demo dentro de fichas reales**: aforo en vivo, reserva de mesa y carta in-venue son
   `lib/mock`. Van marcados con badge, pero conviene rastrearlos para no confundirlos con producto.

---

## 11. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§N). Toda desviación se registra
  como ADR en `docs/adr/`.
- Al cambiar un caso de uso de `events`, `companies`, `catalog`, `trust` o los favoritos de
  `identity`, actualizar el diagrama correspondiente **en el mismo PR** y revisar la tabla del §9.
- Antes de mergear, ejecutar el comando de validación de §3.6: los 12 diagramas deben renderizar.
- Los diagramas nombran casos de uso, endpoints y columnas reales a propósito: un `grep` del nombre en
  el repo debe encontrar el código. Si no lo encuentra, el diagrama está desactualizado.
