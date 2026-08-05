# Canales móviles — Aplicación del asistente

**Serie:** [Diagramas de secuencia](./README.md) · **Transversal** — canal *App Móvil* (§7 mapa C4 ↔ implementación de `PROJECT_SPECS.md`)

> **Alcance.** El canal móvil del asistente (`apps/mobile`), representado con **7 diagramas Mermaid**
> en formato *protocol data flow*, mismo estándar que el resto de la serie.
>
> **Advertencia de estado.** El levantamiento nació TO-BE sobre un andamiaje; hoy `apps/mobile`
> implementa pestañas, catálogo público, **sesión nativa con par de tokens**, **compra con reserva
> de cupo e idempotencia**, **entradas con QR sin red** y el **enlace profundo del código de
> promotor**: **SD-01 a SD-06 son AS-IS**. Solo SD-07 (registro de dispositivos y push) sigue siendo
> diseño propuesto, y depende de trabajo de backend que no existe todavía.
>
> Fecha de levantamiento: 2026-07-28 · Última sincronización: 2026-08-01 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Estado |
|---|---|---|
| SD-01 | [Arranque de la aplicación](#sd-01--arranque-de-la-aplicación) | **AS-IS** — código existente |
| SD-02 | [Sesión nativa: login y almacenamiento](#sd-02--sesión-nativa-login-y-almacenamiento) | **AS-IS** — código existente |
| SD-03 | [Renovación del token y la carrera de rotación](#sd-03--renovación-del-token-y-la-carrera-de-rotación) | **AS-IS** — código existente |
| SD-04 | [Catálogo, ficha y enlace profundo](#sd-04--catálogo-ficha-y-enlace-profundo) | **AS-IS** — código existente |
| SD-05 | [Compra desde el móvil](#sd-05--compra-desde-el-móvil) | **AS-IS** — código existente |
| SD-06 | [Entradas con QR sin red](#sd-06--entradas-con-qr-sin-red) | **AS-IS** — código existente |
| SD-07 | [Registro de dispositivo y notificaciones](#sd-07--registro-de-dispositivo-y-notificaciones) | TO-BE |

---

## 2. Punto de partida real

### 2.1 Qué hay hoy en `apps/mobile`

| Archivo | Líneas | Contenido |
|---|---|---|
| `app/_layout.tsx` | 32 | `AuthProvider` + `Stack` raíz: `evento/[slug]`, `entrada/[id]`, `comprar/[eventId]`, `p/[code]` y el modal `login`. |
| `app/(tabs)/_layout.tsx` | 56 | Tab bar: Inicio, Eventos, Entradas y Cuenta (Ionicons, tinte carmín). |
| `app/(tabs)/index.tsx` | 158 | Inicio: hero del próximo evento + rail "Próximas noches" (`fetchUpcomingEvents`). |
| `app/(tabs)/eventos.tsx` | 123 | Lista con búsqueda con debounce (`fetchEvents`), pull-to-refresh y estados. |
| `app/(tabs)/entradas.tsx` | 209 | Entradas (SD-06): `GET /tickets/me`, copia local y aviso de datos guardados sin red. |
| `app/(tabs)/cuenta.tsx` | 209 | Sesión real (SD-02): perfil vía `GET /auth/me`, login/logout y estado del servicio. |
| `app/evento/[slug].tsx` | 262 | Ficha: flyer con scrim, tramos de entrada y CTA que lleva al checkout. |
| `app/comprar/[eventId].tsx` | 335 | Checkout (SD-05): tramo, asistentes, método de pago y estado de éxito con QR. |
| `app/entrada/[id].tsx` | 154 | Entrada a pantalla completa (SD-06): QR grande, brillo al máximo y sello de estado. |
| `app/p/[code].tsx` | 110 | Aterrizaje del código de promotor (SD-04 fase 3) con CTA al checkout precargado. |
| `app/login.tsx` | 183 | Login nativo (SD-02): `loginSchema` en local, `signIn` y mapeo de errores problem+json. |
| `components/` | 522 | `ui.tsx` (primitivos del DS + `Field`), `event-card.tsx`, `flyer.tsx` y `qr.tsx`. |
| `lib/api-client.ts` | 259 | Cliente tipado: catálogo, auth, holds, checkout, entradas y códigos de canje. |
| `lib/errors.ts` | 32 | `ApiError` (problem+json) y `NetworkError`: distinción que gobierna el reintento. |
| `lib/auth.ts` | 96 | Par de tokens en `expo-secure-store`, claims (`claimsOf`) y frescura (`isTokenFresh`). |
| `lib/auth-context.tsx` | 151 | `AuthProvider`: rehidratación, *single-flight* de refresh y logout con revocación. |
| `lib/use-checkout.ts` | 229 | Máquina del checkout: ciclo de vida del hold, validación y envío con reintento. |
| `lib/checkout-draft.ts` + `-rules.ts` | 105 | Borrador con clave de idempotencia y decisión de reutilizarla o estrenarla. |
| `lib/checkout-errors.ts` | 41 | `code` de `CHECKOUT_ERROR_CODES` a copy de UX, e `isRetryable`. |
| `lib/local-db.ts` | 33 | `expo-sqlite`: apertura y migración de `ticket_cache` y `checkout_draft`. |
| `lib/tickets-cache.ts` + `-reconcile.ts` | 96 | Copia local de entradas: escritura, lectura y reconciliación con el backend. |
| `lib/storage.ts` + `lib/storage-url.ts` | 32 | Key de S3 a URL renderizable (espejo de `storage-context.tsx` de la web). |
| `lib/net.ts` | 21 | Estado de conexión con `NetInfo` y hook `useIsOnline`. |
| `lib/theme.ts` + `lib/format.ts` | 117 | Tokens RAVENUE copiados de `globals.css` + formato es-PE de fecha y precio. |
| `lib/logger.ts` | 55 | Logger compartido con el resto de apps nativas. |
| `lib/*.spec.ts` | 189 | Vitest sobre los módulos puros: errores, reintento, borrador y reconciliación. |

El canal ya compra, guarda las entradas y las muestra sin red. `fetchZones()` sigue definido y **no se
invoca desde ningún sitio**. Lo que falta es el registro de dispositivos y el push (SD-07).

### 2.2 Qué declara la configuración

`app.json` y `package.json` describen una intención bastante más amplia que el código:

| Declarado | Uso actual |
|---|---|
| `scheme: "ravenue"` | En uso: `ravenue://p/{code}` lo resuelve expo-router (SD-04 fase 3) |
| `expo-router` con `typedRoutes` | Once rutas: cuatro pestañas, `evento/[slug]`, `entrada/[id]`, `comprar/[eventId]`, `p/[code]`, `login` y los layouts |
| `expo-linear-gradient` y `@expo/vector-icons` | En uso: scrims del hero/ficha, placeholder de flyer y tab bar |
| `expo-secure-store` | En uso: par de tokens de sesión en Keychain o Keystore (SD-02) |
| `expo-sqlite` | En uso: `ticket_cache` y `checkout_draft` (`lib/local-db.ts`) |
| `expo-linking` | En uso: enlaces `ravenue://p/{code}` resueltos por expo-router |
| `expo-brightness` | En uso: brillo al máximo mientras el QR está visible (SD-06 fase 2) |
| `expo-crypto` | En uso: `randomUUID()` de la clave de idempotencia (SD-05) |
| `react-native-svg` y `qrcode` | En uso: `components/qr.tsx`, misma librería generadora que la web |
| `@react-native-community/netinfo` | En uso: `lib/net.ts`, misma versión que `apps/validator` |
| `expo-notifications` | Sin uso |
| `react-native-maps` | Sin uso |
| `ios.associatedDomains` y `android.intentFilters` | Declarados e **inertes**: exigen dev build y `assetlinks.json` / AASA en el dominio |
| `@urnight/contracts` | Tipos de events, ticket-types, locals, auth, checkout (`createOrderSchema`, holds, tickets) y códigos de canje |

### 2.3 Qué ya está resuelto en la app hermana

`apps/validator` no es un andamiaje: implementa el patrón nativo completo contra el mismo API. El
canal del asistente partió de ese patrón **duplicándolo** (ver §9-3): extraerlo a un paquete
compartido sigue pendiente.

| Pieza | `apps/validator` | `apps/mobile` |
|---|---|---|
| Cliente HTTP con `NetworkError` frente a `ApiError` | ✅ `lib/api-client.ts` | ✅ `request()` con `ApiError` problem+json |
| Token en almacenamiento seguro | ✅ `expo-secure-store` (Keychain o Keystore) | ✅ par completo access + refresh (`lib/auth.ts`) |
| Contexto de sesión con rehidratación al arrancar | ✅ `AuthProvider` | ✅ `AuthProvider` (`lib/auth-context.tsx`) |
| Decodificación local de claims para gating de UX | ✅ `isValidatorToken` | ✅ `claimsOf` + `isTokenFresh` |
| Detección de reconexión | ✅ `NetInfo` | ✅ `lib/net.ts`, misma versión |
| Persistencia local en SQLite | ✅ `offline-cache.ts` — cola de escrituras pendientes | ✅ `lib/local-db.ts` — copia de entradas y borrador de compra |
| Renovación del token | ✅ *single-flight* con rotación y `AppState` (`lib/session-rules.ts`) | ✅ *single-flight* con rotación (SD-03) |

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
9. **Infraestructura con su comando real**, no con una paráfrasis: `SELECT * FROM {tabla} WHERE {columna} = ?`,
   `SET {clave} EX {ttl}`, `SMEMBERS`, `INCR`. Hace el diagrama auditable
   contra los adapters Drizzle y Redis.
10. **Placeholders entre llaves**, nunca entre `<` `>` (Mermaid los interpreta como HTML): `{recursoId}`.

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
  -i docs/diagramas-secuencia/90-canales-moviles.md \
  -o /tmp/90-canales-moviles.md
```

También sirven mermaid.live y la extensión *Markdown Preview Mermaid Support* de VS Code. GitHub
renderiza estos bloques de forma nativa.

---

## 4. Bloque 0 · Estado actual

### SD-01 · Arranque de la aplicación

**AS-IS.** Arranque real: navegación por pestañas y portada del catálogo.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant APP as app/_layout.tsx
    participant TABS as app/(tabs)/_layout.tsx
    participant SCR as app/(tabs)/index.tsx
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    participant EC as EventsController

    note over U, SCR: Fase 1 · Montaje de la navegación por pestañas
    U->>APP: abre la aplicación
    APP->>APP: Stack raíz con el tema oscuro RAVENUE (lib/theme.ts)
    APP->>TABS: renderiza el grupo (tabs)
    TABS-->>U: pestañas Inicio, Eventos, Billetera y Cuenta
    TABS->>SCR: monta la pestaña Inicio

    note over SCR, EC: Fase 2 · Portada con los próximos eventos
    SCR->>API: fetchUpcomingEvents() dentro de useEffect
    API->>API: resolveApiUrl() deriva el host del API del hostUri de Metro
    API->>EDGE: GET /api/v1/events/upcoming · sin cabecera de autorización
    EDGE->>EC: listado público de próximos eventos
    EC-->>EDGE: eventos publicados ordenados por fecha
    alt respuesta con eventos
        EDGE-->>API: 200 OK · EventListResponse
        API-->>SCR: eventos
        SCR-->>U: hero con el primer evento y rail "Próximas noches"
    else respuesta vacía
        EDGE-->>API: 200 OK · lista vacía
        API-->>SCR: lista vacía
        SCR-->>U: estado vacío "Aún no hay noches anunciadas"
    else fallo de red
        API->>API: log.error con el mensaje del error (getJson)
        API-->>SCR: throw
        SCR-->>U: ErrorState con acción Reintentar
    end
    note over API: getJson registra un no-2xx con log.warn pero NO lanza:<br/>solo lanza si el fetch no llega a responder.
    note over U, EC: La comprobación de /health vive ahora en la pestaña Cuenta:<br/>fetchHealth() pinta el estado del servicio en app/(tabs)/cuenta.tsx.<br/>La sesión nativa ya existe: AuthProvider rehidrata al arrancar (SD-02).<br/>Sigue sin haber compra ni billetera. fetchZones() existe sin usarse.
```

---

## 5. Bloque 1 · Sesión nativa (AS-IS)

### SD-02 · Sesión nativa: login y almacenamiento

**AS-IS.** El móvil **no** reutiliza el flujo de la web: Auth.js con handoff de `Credentials` es
servidor a servidor. Habla directo con el API, como el validador, pero guardando el **par completo**
de tokens. Código: `app/login.tsx`, `lib/auth-context.tsx`, `lib/auth.ts`, `lib/api-client.ts`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant SCR as app/login.tsx
    participant CTX as AuthProvider (lib/auth-context.tsx)
    participant SEC as expo-secure-store
    participant API as lib/api-client.ts
    participant EDGE as Edge API

    note over U, SEC: Fase 1 · Rehidratación al arrancar (AuthProvider montado en app/_layout.tsx)
    U->>CTX: abre la aplicación
    CTX->>SEC: getStoredTokens() — getItemAsync del access y del refresh
    SEC-->>CTX: par guardado o null
    alt refresh token vigente
        CTX->>CTX: claimsOf(accessToken) decodifica los claims solo para gating de UX
        note over CTX: El servidor verifica la firma en cada petición. Aunque el access<br/>haya vencido la sesión sigue: se renovará on-demand (SD-03).
        CTX-->>U: status authenticated — pestañas con sesión
    else sin tokens o refresh vencido
        CTX->>SEC: clearTokens() si quedaba un par muerto
        CTX-->>U: status guest — la pestaña Cuenta ofrece "Ingresar"

        note over U, EDGE: Fase 2 · Autenticación directa contra el API
        U->>SCR: abre el modal /login y escribe correo y contraseña
        SCR->>SCR: loginSchema.safeParse valida en local (zod de @urnight/contracts)
        SCR->>CTX: signIn(email, password)
        CTX->>API: loginRequest({ email, password })
        API->>EDGE: POST /api/v1/auth/login · { email, password }
        note over EDGE: Ruta sensible: 10 peticiones por minuto por IP y por correo,<br/>fail-closed, con bloqueo de 15 minutos tras 5 fallos.
        alt credenciales inválidas
            EDGE-->>API: 401 · problem+json { code identity/invalid-credentials }
            API-->>SCR: ApiError 401
            SCR-->>U: "Correo o contraseña incorrectos", sin revelar si la cuenta existe
        else cuenta bloqueada por intentos
            EDGE-->>API: 429 más Retry-After
            API-->>SCR: ApiError 429
            SCR-->>U: aviso de bloqueo temporal
        else credenciales correctas
            EDGE-->>API: 200 OK · AuthTokensResponse { accessToken, refreshToken, expiresIn }

            note over CTX, SEC: Fase 3 · Persistencia segura del PAR completo
            CTX->>SEC: storeTokens() — setItemAsync del accessToken y del refreshToken
            note over CTX, SEC: Diferencia deliberada con el validador, que descarta el refresh<br/>token y obliga a re-login al vencer el access. Ver §9.
            SEC-->>CTX: guardado en Keychain o Keystore
            CTX-->>SCR: sesión iniciada
            SCR-->>U: router.back() — vuelve a la pestaña con sesión
        end
    end

    note over U, EDGE: Fase 4 · Cierre de sesión (pestaña Cuenta)
    U->>CTX: signOut()
    CTX->>API: logoutRequest(refreshToken)
    API->>EDGE: POST /api/v1/auth/logout · { refreshToken }
    EDGE-->>API: 204 No Content
    note over API, EDGE: El móvil SÍ llama a este endpoint, a diferencia de la web,<br/>que hoy no lo hace y deja el jti vivo en Redis hasta su TTL.<br/>Si la revocación falla por red se registra y se cierra en local igual.
    CTX->>SEC: clearTokens() — deleteItemAsync de ambos tokens
    CTX-->>U: status guest — la pestaña Cuenta vuelve a ofrecer "Ingresar"
```

### SD-03 · Renovación del token y la carrera de rotación

**AS-IS.** El backend rota el refresh en un solo uso y, ante un `jti` ya consumido, **revoca toda la
familia de sesiones del usuario**. El móvil lo mitiga con un *single-flight* (`refreshInFlight` en
`lib/auth-context.tsx`) y renovación anticipada al volver del segundo plano.

```mermaid
sequenceDiagram
    autonumber
    participant P1 as Pantalla A
    participant P2 as Pantalla B
    participant MTX as AuthProvider · refreshInFlight
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    participant RS as Redis · refresh store

    note over P1, RS: Escenario del problema, si NO hubiera mutex
    P1->>API: petición con el access token vencido
    P2->>API: petición con el mismo access token vencido
    API->>EDGE: dos POST /auth/refresh en paralelo con el MISMO refreshToken
    EDGE->>RS: GET del jti para la primera petición
    RS-->>EDGE: la clave existe
    EDGE->>RS: DEL del jti y alta de uno nuevo
    EDGE-->>API: 200 OK para la primera
    EDGE->>RS: GET del jti para la segunda
    RS-->>EDGE: null, ese jti ya fue rotado
    EDGE->>RS: revokeAllForUser — borra TODA la familia de refresh
    EDGE-->>API: 401 · { code identity/invalid-token }
    note over EDGE, RS: Detección de reuso: el backend no distingue una carrera legítima<br/>de un token robado, y hace lo correcto desde su punto de vista.<br/>Efecto en el usuario: se cierra su sesión en el móvil Y en la web.

    note over P1, RS: Diseño implementado · una sola renovación en vuelo (getAccessToken)
    P1->>MTX: getAccessToken()
    P2->>MTX: getAccessToken()
    MTX->>MTX: isTokenFresh detecta el access vencido (margen de 30s, igual que la web)
    MTX->>MTX: si ya hay una renovación en curso, ambas esperan la misma promesa
    MTX->>API: refreshRequest(refreshToken) una única vez
    API->>EDGE: POST /api/v1/auth/refresh · { refreshToken }
    EDGE->>RS: valida y rota el jti
    RS-->>EDGE: rotación correcta
    EDGE-->>API: 200 OK · AuthTokensResponse con el par rotado
    API-->>MTX: par nuevo
    MTX->>MTX: storeTokens() persiste el par y libera a quien esperaba
    MTX-->>P1: access token vigente
    MTX-->>P2: el MISMO access token vigente
    note over MTX: Si el refresh devuelve 401 o 400 la sesión murió: clearTokens()<br/>y vuelta a invitado (SD-02 fase 4 sin llamada al servidor).<br/>Un fallo de red NO cierra la sesión: se reintentará después.
    note over MTX: Además del single-flight, un listener de AppState renueva de forma<br/>anticipada al volver la app a primer plano, en vez de esperar al 401.
```

---

## 6. Bloque 2 · Descubrimiento y compra (TO-BE)

### SD-04 · Catálogo, ficha y enlace profundo

**AS-IS.** Las tres fases están implementadas: lista con búsqueda, ficha con tramos y aterrizaje del
código de promotor. El móvil consume los mismos endpoints públicos que el consumidor web, con los
mismos tipos de `@urnight/contracts`. La caché local del catálogo sigue sin existir —cada apertura
pide al API— y los enlaces universales quedan declarados pero inertes (ver §9).

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant LST as app/(tabs)/eventos.tsx
    participant DET as app/evento/[slug].tsx
    participant PRM as app/p/[code].tsx
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    participant OS as Sistema operativo

    note over U, EDGE: Fase 1 · Catálogo y búsqueda (AS-IS)
    U->>LST: abre la pestaña Eventos
    LST->>API: fetchEvents() sin filtros
    API->>EDGE: GET /api/v1/events
    EDGE-->>API: 200 OK · EventListResponse
    API-->>LST: eventos
    LST-->>U: filas EventRow con flyer, fecha y nombre
    opt búsqueda por texto
        U->>LST: escribe en el buscador
        LST->>LST: debounce de 350 ms antes de pedir
        LST->>API: fetchEvents con q
        API->>EDGE: GET /api/v1/events?q={q}
        EDGE-->>API: 200 OK · EventListResponse filtrada
        API-->>LST: resultados
        LST-->>U: lista filtrada o estado vacío "Nada por aquí"
    end
    note over LST: La caché local propuesta sigue TO-BE: cada apertura pide al API.<br/>El API ya soporta limit y offset, así que el listado puede pasar a<br/>scroll infinito sin tocar el backend.

    note over U, EDGE: Fase 2 · Ficha del evento (AS-IS)
    U->>LST: toca un evento
    LST->>DET: router.push a /evento/{slug}
    DET->>API: fetchEventBySlug(slug)
    API->>EDGE: GET /api/v1/events/{slug}
    EDGE-->>API: 200 OK · EventResponse
    API-->>DET: detalle del evento
    par Entradas
        DET->>API: fetchEventTicketTypes(eventId)
        API->>EDGE: GET /api/v1/events/{eventId}/ticket-types
        EDGE-->>API: 200 OK · TicketTypeListResponse
    and Nombre del local
        DET->>API: fetchLocals()
        API->>EDGE: GET /api/v1/locals
        EDGE-->>API: 200 OK · LocalListResponse
        DET->>DET: busca el local por el localId del evento
    end
    DET-->>U: flyer con scrim, tramos con precio y CTA "Comprar entradas"
    note over DET: Promise.allSettled: si entradas o locales fallan, la ficha se<br/>pinta igual con lo que llegó. El CTA lleva a /comprar/{eventId} (SD-05).

    note over OS, PRM: Fase 3 · Enlace profundo del código de promotor (AS-IS)
    U->>OS: pulsa un enlace ravenue://p/{code} recibido por mensajería
    alt scheme propio de la app
        OS->>PRM: expo-router abre app/p/[code].tsx
        PRM->>API: resolveRedemptionCode(code)
        API->>EDGE: GET /api/v1/redemption-codes/{code} · sin cabecera de autorización
        EDGE-->>API: 200 OK · ResolveRedemptionCodeResponse con isFree y savings
        API-->>PRM: oferta del promotor
        PRM-)EDGE: POST /api/v1/redemption-codes/{code}/click sin esperar respuesta
        PRM-->>U: oferta con CTA a /comprar/{eventId} y el código precargado
    else enlace https del dominio web
        OS-->>U: abre el navegador
        note over OS, PRM: Los enlaces universales están declarados en app.json pero inertes:<br/>exigen dev build y que el dominio sirva assetlinks.json y<br/>apple-app-site-association. Ver §9.
    end
    note over PRM: El clic de atribución es fire-and-forget: si falla, la oferta se<br/>pinta igual. Nunca bloquea la pantalla.
```

### SD-05 · Compra desde el móvil

**AS-IS.** El checkout real gira sobre **reserva de cupo con TTL**, igual que el consumidor web: el
`holdId` viaja dentro de `items[]`. El móvil suma lo que la web todavía no manda, la cabecera
`Idempotency-Key`, y la persiste: en móvil la red se cae a mitad de una compra con normalidad.
Código: `app/comprar/[eventId].tsx`, `lib/use-checkout.ts`, `lib/checkout-draft.ts`,
`lib/checkout-errors.ts`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant SCR as app/comprar/[eventId].tsx
    participant HK as lib/use-checkout.ts
    participant DFT as lib/checkout-draft.ts
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    participant CO as CheckoutUseCase

    note over U, EDGE: Fase 1 · Reserva de cupo
    U->>SCR: abre /comprar/{eventId} desde la ficha
    SCR->>HK: useCheckout con el evento y sus tramos
    HK->>API: createTicketHold({ eventId, ticketTypeId, quantity })
    API->>EDGE: POST /api/v1/ticket-holds · Authorization Bearer {accessToken}
    alt cupo disponible
        EDGE-->>API: 201 Created · TicketHoldResponse { id, expiresAt, status active }
        API-->>HK: hold activo
        HK-->>U: botón habilitado y cuenta atrás hasta expiresAt
    else sin stock
        EDGE-->>API: 409 · problem+json { code checkout/insufficient-stock }
        API-->>HK: ApiError 409
        HK-->>U: "Ya no quedan entradas suficientes en este tramo"
    end
    opt cambia de tramo o de cantidad
        U->>SCR: ajusta la selección
        HK->>API: createTicketHold con replaceHoldId
        API->>EDGE: POST /api/v1/ticket-holds · { replaceHoldId }
        EDGE-->>API: 201 Created · hold nuevo, el anterior queda liberado
        API-->>HK: hold rotado
    end
    note over HK: Las llamadas se serializan en una cadena de promesas con contador<br/>de versión: dos cambios rápidos dejarían holds huérfanos ocupando<br/>stock hasta su TTL. Al salir se llama a DELETE /ticket-holds/{id}.

    note over U, DFT: Fase 2 · Borrador con clave de idempotencia
    U->>SCR: completa asistentes, método de pago y código promocional
    SCR->>SCR: attendeeInputSchema y createOrderSchema validan en local (zod de @urnight/contracts)
    HK->>DFT: saveDraft con la clave de expo-crypto y estado sent
    DFT-->>HK: guardado en SQLite
    note over DFT: La clave se persiste ANTES de enviar y sobrevive a que el sistema<br/>mate la app: es lo que permite reintentar sin cobrar dos veces.<br/>keyForSubmission la reutiliza solo si el pedido no cambió.

    note over HK, CO: Fase 3 · Envío con reintento seguro
    loop reintento acotado, solo ante fallo de red
        HK->>API: checkoutRequest(dto, idempotencyKey)
        API->>EDGE: POST /api/v1/orders/checkout · Bearer · Idempotency-Key
        alt sin respuesta del servidor
            API-->>HK: NetworkError
            HK-->>U: "Sin conexión, reintentando"
        else respuesta del servidor
            EDGE->>CO: execute con dedupe por clave
            alt la clave ya tenía orden asociada
                CO-->>EDGE: reproduce la orden y sus entradas, sin cobrar de nuevo
            else primera vez
                CO->>CO: convierte el hold, aplica barreras anti-sobreventa y cobra
            end
            EDGE-->>API: 201 Created · { order, tickets }
            API-->>HK: resultado
        end
    end
    note over API, EDGE: Un 409 checkout/stock-locked o un 402 checkout/payment-rejected NO se<br/>reintentan: son respuestas del servidor, no fallos de red (isRetryable).

    note over HK, U: Fase 4 · Cierre
    HK->>DFT: upsertTickets guarda las entradas en ticket_cache
    DFT-->>HK: copia local lista
    HK->>DFT: clearDraft borra el borrador y su clave
    HK-->>U: orden confirmada con el QR en pantalla y acceso a Entradas
    note over U, DFT: Las entradas quedan en la copia local antes de salir de la pantalla:<br/>quien compra camino a la puerta ya tiene el QR sin red (SD-06).
```

---

## 7. Bloque 3 · Entradas (AS-IS)

### SD-06 · Entradas con QR sin red

**AS-IS.** El caso de uso decisivo del canal: en la puerta de una discoteca puede no haber cobertura.
El token del QR es la fuente de verdad y cabe en el dispositivo. Código: `app/(tabs)/entradas.tsx`,
`app/entrada/[id].tsx`, `lib/tickets-cache.ts`, `components/qr.tsx`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant LST as app/(tabs)/entradas.tsx
    participant DET as app/entrada/[id].tsx
    participant CACHE as lib/tickets-cache.ts
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    actor V as Validador de puerta

    note over U, EDGE: Fase 1 · Sincronización cuando hay red
    U->>LST: abre la pestaña Entradas
    alt sesión activa
        LST->>API: fetchMyTickets()
        API->>EDGE: GET /api/v1/tickets/me · Authorization Bearer {accessToken}
        alt hay conexión
            EDGE-->>API: 200 OK · TicketListResponse con qrCode, qrImageKey y datos del evento
            API-->>LST: entradas
            LST->>CACHE: writeTickets — INSERT OR REPLACE de las vigentes y DELETE de las ausentes
            CACHE-->>LST: copia local actualizada
            LST-->>U: vigentes arriba, usadas atenuadas debajo
        else sin conexión
            API-->>LST: NetworkError
            LST->>CACHE: readCachedTickets()
            CACHE-->>LST: entradas guardadas y hora de la última sincronización
            LST-->>U: aviso "mostrando datos guardados"
        end
    else invitado
        LST-->>U: EmptyState con acción Ingresar al modal /login
    end
    note over CACHE: Se persiste el token qrCode, nunca la imagen: pesa nada y permite<br/>dibujar el QR en el dispositivo aunque no haya red. El contenido del<br/>token no se registra jamás en el log.

    note over U, V: Fase 2 · Presentación en puerta, sin red
    U->>DET: toca una entrada
    DET->>CACHE: readCachedTickets() antes que la red — la puerta puede no tener cobertura
    CACHE-->>DET: entrada
    DET->>DET: components/qr.tsx genera el SVG desde el token con qrcode
    note over DET: Con red y qrImageKey se muestra el PNG del storage resuelto por<br/>resolveStorageUrl. Sin red se dibuja desde el token. Ambos codifican<br/>lo mismo, así que el escaneo funciona igual.
    DET->>DET: expo-brightness sube el brillo guardando el valor previo
    DET-->>U: código en pantalla
    V->>DET: escanea el QR con la app de puerta
    note over V: A partir de aquí manda la app del validador: veredicto online, o<br/>encolado offline con sincronización posterior.
    U->>DET: sale de la entrada
    DET->>DET: restaura el brillo previo, también al pasar a segundo plano

    note over DET, EDGE: Fase 3 · Reconciliación del estado
    DET->>API: al enfocar o al recuperar red, vuelve a pedir las entradas
    API->>EDGE: GET /api/v1/tickets/me · Authorization Bearer {accessToken}
    EDGE-->>API: 200 OK con la entrada ya en estado used
    API-->>DET: estado actualizado
    DET->>CACHE: writeTickets sobrescribe la copia local
    DET-->>U: la entrada aparece como usada, con el sello sobre el QR
    note over DET, U: El estado local es una copia, nunca la verdad: quien decide si una<br/>entrada sirve es el backend en el momento del escaneo.
```

---

## 8. Bloque 4 · Notificaciones (TO-BE)

### SD-07 · Registro de dispositivo y notificaciones

**TO-BE.** El worker ya tiene un `PushPort`, pero **no existe ninguna tabla ni endpoint de tokens de
dispositivo** en todo el repositorio: hoy `LogPushAdapter` escribe en el log y ahí muere.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant APP as Aplicación móvil
    participant OS as Servicio de notificaciones del sistema
    participant EDGE as Edge API
    participant UC as RegisterDeviceUseCase propuesto
    participant WK as NotificationsProcessor
    participant DB as PostgreSQL

    note over U, DB: Fase 1 · Permiso y alta del dispositivo
    APP->>U: solicita permiso de notificaciones tras el primer valor entregado
    alt el usuario deniega
        U-->>APP: permiso denegado
        APP->>APP: no vuelve a preguntar, ofrece activarlo desde ajustes
    else permiso concedido
        U-->>APP: permiso concedido
        APP->>OS: obtiene el token de notificaciones del dispositivo
        OS-->>APP: token del dispositivo
        APP->>EDGE: POST /api/v1/me/devices · Bearer · { token, plataforma }
        EDGE->>UC: execute({ userId, token, platform })
        UC->>DB: INSERT o UPDATE en la tabla de dispositivos, única por token
        note over UC, DB: Nada de esto existe hoy: ni la tabla, ni el endpoint, ni el caso<br/>de uso. Es la pieza que falta para cerrar el canal de push.
        DB-->>UC: fila registrada
        UC-->>EDGE: void
        EDGE-->>APP: 204 No Content
    end

    note over WK, U: Fase 2 · Envío desde el worker
    WK->>WK: procesa un job de la cola notifications
    WK->>DB: SELECT de los dispositivos activos del usuario
    DB-->>WK: tokens del usuario
    WK->>OS: envía la notificación a cada token
    alt token caducado o rechazado
        OS-->>WK: error de token inválido
        WK->>DB: marca el dispositivo como inactivo
        note over WK, DB: Sin esta limpieza la tabla acumula tokens muertos y cada envío<br/>arrastra fallos que no son fallos.
    else entregada
        OS-->>U: notificación en el dispositivo
    end
    WK->>DB: INSERT en notification con canal push y estado sent
    note over WK, DB: La fila de notification YA se escribe hoy: es lo que alimenta<br/>GET /notifications/me. Lo que falta es la entrega real.

    note over U, APP: Fase 3 · Apertura desde la notificación
    U->>APP: pulsa la notificación
    APP->>APP: enruta al destino según el tipo del aviso
    note over APP: Recordatorio de evento lleva a la entrada, aviso de cancelación<br/>a la ficha del evento, invitación de promotor a la bandeja.<br/>Requiere los enlaces profundos de SD-04.
    APP-->>U: pantalla correspondiente
```

**Preferencias que ya existen y hay que respetar.** `user_preference.accepts_reminders` y
`accepts_marketing` se persisten desde el onboarding y desde la cuenta. El envío push debe filtrar por
ellas, y las transaccionales (entradas emitidas) deben distinguirse de las promocionales.

---

## 9. Brechas y riesgos

Hallazgos de la lectura del código. Los cinco primeros condicionan cualquier plan sobre este canal.

1. **El canal ya compra y muestra entradas sin red.** Navegación por pestañas, portada, lista con
   búsqueda, ficha, sesión nativa, checkout con reserva de cupo e idempotencia, entradas con QR
   offline y aterrizaje del código de promotor (SD-01 a SD-06). Lo que queda abierto es SD-07 y
   `fetchZones()`, que sigue definido y **no se invoca desde ningún sitio**.
2. **Los enlaces universales siguen sin activar.** El scheme propio `ravenue://p/{code}` ya funciona
   y lo resuelve expo-router. Pero `ios.associatedDomains` y `android.intentFilters` están declarados
   e **inertes**: exigen un dev build (`eas.json`, que no existe) y que el dominio web sirva
   `assetlinks.json` y `apple-app-site-association`. Un enlace `https` compartido por un promotor
   sigue abriendo el navegador. De las dependencias declaradas sin usar quedan `expo-notifications`
   (bloqueada por SD-07) y `react-native-maps`.
3. **El patrón nativo ya resuelto no está extraído — y la duplicación creció.** `apps/validator`
   implementa cliente HTTP con distinción entre fallo de red y respuesta de error, almacenamiento
   seguro del token, contexto de sesión con rehidratación y decodificación local de claims.
   `apps/mobile` reimplementó ese patrón por su cuenta (SD-02): dos copias de `decodeSegment`,
   dos `AuthProvider`, dos clientes HTTP y ahora también dos aperturas de SQLite y dos detecciones
   de red. Extraerlo a un paquete compartido sigue pendiente.
4. ~~**El validador descarta el refresh token.**~~ **Cerrada.** `apps/validator` guarda el par completo
   y renueva con *single-flight*, y un fallo de red al renovar ya no expulsa: la puerta sigue
   escaneando y encolando mientras el refresh siga vigente.
5. **La rotación de un solo uso es peligrosa en móvil.** El backend revoca **toda** la familia de
   refresh del usuario cuando recibe un `jti` ya consumido, sin poder distinguir una carrera legítima
   de un robo. Varias pantallas despertando a la vez con el access token vencido disparan renovaciones
   paralelas: la segunda cierra la sesión del usuario en el móvil **y en la web**. El móvil del
   asistente ya implementa la mitigación completa (single-flight `refreshInFlight` + renovación
   anticipada con `AppState`, SD-03), y el validador implementa ahora la misma.
6. **No existe registro de dispositivos.** Cero coincidencias de token de dispositivo en todo el
   repositorio: no hay tabla, ni endpoint, ni caso de uso. `PushPort` está cableado a `LogPushAdapter`
   y escribe en el log. El canal de notificaciones está abierto por el lado del worker y cerrado por
   el lado del dispositivo.
7. **El móvil no puede reutilizar la sesión de la web.** Auth.js con handoff de `Credentials` es
   servidor a servidor por diseño. El móvil habla directo con `/auth/login`, `/auth/refresh` y
   `/auth/logout`. Así está implementado en `apps/mobile` (SD-02), igual que en el validador.
8. **El móvil ya llama a `POST /auth/logout`** y borra el par local aunque la revocación falle por
   red (SD-02 fase 4). La web sigue sin hacerlo y deja el `jti` vivo en Redis hasta su TTL: la
   brecha queda solo del lado web.
9. **Varias brechas de otros dominios pegan aquí de lleno.** Sin entrega real de correo y push
   (`LogEmailAdapter` y `LogPushAdapter`), sin notificación de cancelación de evento y sin listados de
   trámites, el valor de una app nativa se reduce a comprar y mostrar el QR. Conviene priorizar esas
   piezas antes que la propia app, o al menos en paralelo.

---

## 10. Orden de construcción sugerido

Derivado de lo anterior, no de una preferencia. Cada paso desbloquea al siguiente.

| Paso | Qué | Por qué antes que lo demás |
|---|---|---|
| 1 | Extraer el patrón nativo del validador a un paquete compartido | Evita duplicar sesión, cliente HTTP y cola offline en dos apps |
| 2 | ~~Sesión con par de tokens, *single-flight* de renovación y logout real (SD-02, SD-03)~~ **Hecho** | Sin sesión no hay billetera ni compra, y la carrera de rotación rompe también la web |
| 3 | ~~Catálogo y ficha (SD-04)~~ **Hecho** | Solo consume endpoints públicos que ya existen: es el tramo de menor riesgo |
| 4 | ~~Entradas con copia local del token del QR (SD-06)~~ **Hecho** | Es el valor diferencial del canal frente a la web móvil |
| 5 | ~~Compra con reserva de cupo y clave de idempotencia persistida (SD-05)~~ **Hecho** | Necesita sesión y ficha, y el backend ya las soporta |
| 6 | Registro de dispositivos y push (SD-07) | Requiere trabajo de backend nuevo, no solo de la app |
| 7 | ~~Enlace profundo por scheme propio (SD-04, fase 3)~~ **Hecho** · enlaces universales pendientes | Cierra el circuito con los códigos de promotor. Los universales exigen dev build y dominio |

---

## 11. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§5 cubre los canales nativos). Toda
  desviación se registra como ADR en `docs/adr/`.
- Solo SD-07 sigue siendo TO-BE: **cuando se implemente debe reescribirse como AS-IS en el mismo
  PR**, con los nombres reales de archivos y casos de uso, y moverse su fila de la tabla del §1.
- Antes de mergear, ejecutar el comando de validación de §3: los 7 diagramas deben renderizar.
- El inventario del §2.1 se recuenta con
  `git ls-files 'apps/mobile/app' 'apps/mobile/lib' 'apps/mobile/components'`: si un fichero cambia
  de tamaño de forma apreciable, la tabla deja de describir el código.
