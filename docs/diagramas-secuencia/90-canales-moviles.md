# Canales móviles — Aplicación del asistente

**Serie:** [Diagramas de secuencia](./README.md) · **Transversal** — canal *App Móvil* (§7 mapa C4 ↔ implementación de `PROJECT_SPECS.md`)

> **Alcance.** El canal móvil del asistente (`apps/mobile`), representado con **7 diagramas Mermaid**
> en formato *protocol data flow*, mismo estándar que el resto de la serie.
>
> **Advertencia de estado.** El levantamiento nació TO-BE sobre un andamiaje; hoy `apps/mobile`
> implementa pestañas, catálogo público y **sesión nativa con par de tokens**: **SD-01, SD-02, SD-03
> y las fases 1–2 de SD-04 son AS-IS**. Compra, billetera y push siguen siendo diseño propuesto,
> calcado de dos fuentes que ya funcionan en este repo: la app de puerta (`apps/validator`) y el
> consumidor web (`apps/web`, que resuelve catálogo, checkout y billetera).
>
> Fecha de levantamiento: 2026-07-28 · Última sincronización: 2026-08-01 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Estado |
|---|---|---|
| SD-01 | [Arranque de la aplicación](#sd-01--arranque-de-la-aplicación) | **AS-IS** — código existente |
| SD-02 | [Sesión nativa: login y almacenamiento](#sd-02--sesión-nativa-login-y-almacenamiento) | **AS-IS** — código existente |
| SD-03 | [Renovación del token y la carrera de rotación](#sd-03--renovación-del-token-y-la-carrera-de-rotación) | **AS-IS** — código existente |
| SD-04 | [Catálogo, ficha y enlace profundo](#sd-04--catálogo-ficha-y-enlace-profundo) | **AS-IS parcial** — fases 1–2 código, fase 3 TO-BE |
| SD-05 | [Compra desde el móvil](#sd-05--compra-desde-el-móvil) | TO-BE |
| SD-06 | [Billetera con QR sin red](#sd-06--billetera-con-qr-sin-red) | TO-BE |
| SD-07 | [Registro de dispositivo y notificaciones](#sd-07--registro-de-dispositivo-y-notificaciones) | TO-BE |

---

## 2. Punto de partida real

### 2.1 Qué hay hoy en `apps/mobile`

| Archivo | Líneas | Contenido |
|---|---|---|
| `app/_layout.tsx` | 30 | `AuthProvider` + `Stack` raíz con tema oscuro, `evento/[slug]` y el modal `login`. |
| `app/(tabs)/_layout.tsx` | 57 | Tab bar: Inicio, Eventos, Billetera y Cuenta (Ionicons, tinte carmín). |
| `app/(tabs)/index.tsx` | 170 | Inicio: hero del próximo evento + rail "Próximas noches" (`fetchUpcomingEvents`). |
| `app/(tabs)/eventos.tsx` | 133 | Lista con búsqueda con debounce (`fetchEvents`), pull-to-refresh y estados. |
| `app/(tabs)/billetera.tsx` | 80 | Estado vacío de marca: las entradas llegan con la sesión nativa (SD-06). |
| `app/(tabs)/cuenta.tsx` | 222 | Sesión real (SD-02): perfil vía `GET /auth/me`, login/logout y estado del servicio. |
| `app/evento/[slug].tsx` | 276 | Ficha: flyer con scrim, tramos de entrada y CTA de compra deshabilitado. |
| `app/login.tsx` | 193 | Login nativo (SD-02): `loginSchema` en local, `signIn` y mapeo de errores problem+json. |
| `components/` | 470 | `ui.tsx` (primitivos del DS + `Field`), `event-card.tsx` y `flyer.tsx` (placeholder de marca). |
| `lib/api-client.ts` | 207 | Cliente tipado: catálogo público + `request()` con `ApiError` y los endpoints de auth. |
| `lib/auth.ts` | 106 | Par de tokens en `expo-secure-store`, claims (`claimsOf`) y frescura (`isTokenFresh`). |
| `lib/auth-context.tsx` | 153 | `AuthProvider`: rehidratación, *single-flight* de refresh y logout con revocación. |
| `lib/theme.ts` + `lib/format.ts` | 129 | Tokens RAVENUE copiados de `globals.css` + formato es-PE de fecha y precio. |
| `lib/logger.ts` | 65 | Logger compartido con el resto de apps nativas. |

Hay sesión nativa con par de tokens (SD-02, SD-03); la compra sigue pendiente: el catálogo consume
endpoints públicos y los CTA de compra remiten a la web. `fetchZones()` sigue definido y **no se
invoca desde ningún sitio**.

### 2.2 Qué declara la configuración

`app.json` y `package.json` describen una intención bastante más amplia que el código:

| Declarado | Uso actual |
|---|---|
| `scheme: "ravenue"` | Sin enlaces profundos configurados |
| `expo-router` con `typedRoutes` | Siete rutas: cuatro pestañas, la ficha `evento/[slug]` y los layouts |
| `expo-linear-gradient` y `@expo/vector-icons` | En uso: scrims del hero/ficha, placeholder de flyer y tab bar |
| `expo-secure-store` | En uso: par de tokens de sesión en Keychain o Keystore (SD-02) |
| `expo-notifications` | Sin uso |
| `expo-sqlite` | Sin uso |
| `react-native-maps` | Sin uso |
| `expo-linking` | Sin uso |
| `@urnight/contracts` | Tipos de events, ticket-types, locals y auth (`loginSchema`, tokens, perfil, problem+json) |

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
| Detección de reconexión | ✅ `NetInfo` | ❌ |
| Cola local en SQLite | ✅ `offline-cache.ts` | ❌ (dependencia instalada) |
| Renovación del token | ❌ **tampoco lo hace el validador** — ver §9 | ✅ *single-flight* con rotación (SD-03) |

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

**AS-IS parcial.** Las fases 1 y 2 están implementadas en `apps/mobile` (lista con búsqueda y ficha
con tramos): el móvil consume los mismos endpoints públicos que el consumidor web, con los mismos
tipos de `@urnight/contracts`. La caché local y el enlace profundo de la fase 3 siguen TO-BE.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant LST as app/(tabs)/eventos.tsx
    participant DET as app/evento/[slug].tsx
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
    DET-->>U: flyer con scrim, tramos con precio y CTA deshabilitado de compra
    note over DET: Promise.allSettled: si entradas o locales fallan, la ficha se<br/>pinta igual con lo que llegó. La compra sigue viviendo en la web.

    note over OS, DET: Fase 3 · Enlace profundo del código de promotor (TO-BE)
    U->>OS: pulsa un enlace WEB_PUBLIC_URL más /p/{code} recibido por mensajería
    alt la app tiene el enlace asociado
        OS->>DET: abre la app con la ruta /p/{code}
        DET->>API: resuelve el código de canje
        EDGE-->>API: 200 OK · oferta con isFree y savings
        DET-->>U: checkout con la entrada precargada
    else la app no está asociada al dominio
        OS-->>U: abre el navegador
        note over OS, DET: Estado actual: el scheme ravenue está declarado en app.json pero<br/>no hay enlaces universales configurados, así que hoy siempre gana<br/>el navegador. Ver §9.
    end
```

### SD-05 · Compra desde el móvil

**TO-BE.** El checkout ya es idempotente por cabecera. En móvil eso deja de ser un lujo: la red se
cae a mitad de una compra con normalidad.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant APP as Pantalla de compra
    participant IDK as Clave de idempotencia local
    participant API as api-client
    participant EDGE as Edge API
    participant CO as CheckoutUseCase

    note over U, IDK: Fase 1 · Preparación del pedido
    U->>APP: elige tramo y carga los asistentes
    APP->>APP: valida mayoría de edad y tope por usuario con el esquema compartido
    APP->>IDK: genera una clave de idempotencia y la persiste con el borrador
    note over IDK: La clave se guarda ANTES de enviar y sobrevive al cierre de la app:<br/>es lo que permite reintentar sin cobrar dos veces.

    note over APP, CO: Fase 2 · Envío con reintento seguro
    loop reintento ante fallo de red
        APP->>API: checkout(dto, token, idempotencyKey)
        API->>EDGE: POST /api/v1/orders/checkout · Bearer · Idempotency-Key
        alt fallo de red, sin respuesta
            API-->>APP: NetworkError
            APP-->>U: "sin conexión, reintentando"
            note over API, APP: Se reintenta con la MISMA clave. Si el primer intento llegó a<br/>crear la orden, el segundo la reproduce en vez de duplicarla.
        else respuesta del servidor
            EDGE->>CO: execute con dedupe por clave
            alt la clave ya tenía orden asociada
                CO-->>EDGE: reproduce la orden y sus entradas, sin cobrar de nuevo
            else primera vez
                CO->>CO: barreras anti-sobreventa y cobro
            end
            EDGE-->>API: 201 Created · { order, tickets }
            API-->>APP: resultado
        end
    end

    note over APP, U: Fase 3 · Cierre
    APP->>IDK: descarta la clave y el borrador
    APP-->>U: compra confirmada, con las entradas ya disponibles en la billetera
    note over APP, EDGE: Un 409 stock_locked o un 402 payment_rejected NO se reintentan:<br/>son respuestas del servidor, no fallos de red.
```

---

## 7. Bloque 3 · Billetera (TO-BE)

### SD-06 · Billetera con QR sin red

**TO-BE.** El caso de uso decisivo del canal: en la puerta de una discoteca puede no haber cobertura.
El token del QR es la fuente de verdad y cabe en el dispositivo.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant APP as Billetera
    participant SQL as SQLite local propuesta
    participant API as api-client
    participant EDGE as Edge API
    actor V as Validador de puerta

    note over U, EDGE: Fase 1 · Sincronización cuando hay red
    U->>APP: abre sus entradas
    APP->>API: getMyTickets(token)
    alt hay conexión
        API->>EDGE: GET /api/v1/tickets/me · Bearer
        EDGE-->>API: 200 OK · TicketResponse[] con qrCode, estado y datos del evento
        API-->>APP: entradas
        APP->>SQL: guarda entradas y token del QR en la base local
        SQL-->>APP: almacenado
        note over APP, SQL: Se persiste el token qrCode, no la imagen: pesa nada y permite<br/>generar el QR en el dispositivo aunque no haya red.
    else sin conexión
        API-->>APP: NetworkError
        APP->>SQL: lee la última copia guardada
        SQL-->>APP: entradas cacheadas
        APP-->>U: aviso de "mostrando datos guardados"
    end

    note over U, V: Fase 2 · Presentación en puerta, sin red
    U->>APP: abre la entrada del evento
    APP->>APP: genera el QR localmente a partir del token
    note over APP: Mismo criterio que la web: si existe la imagen en almacenamiento<br/>se muestra esa, y si no se dibuja desde el token. Ambas codifican<br/>lo mismo, así que el escaneo funciona igual.
    APP->>APP: sube el brillo de la pantalla al máximo mientras el QR está visible
    APP-->>U: código en pantalla
    V->>APP: escanea el QR con la app de puerta
    note over V: A partir de aquí manda la app del validador: veredicto online, o<br/>encolado offline con sincronización posterior.

    note over APP, EDGE: Fase 3 · Reconciliación del estado
    APP->>API: al recuperar red, vuelve a pedir las entradas
    EDGE-->>API: 200 OK con la entrada ya en estado used
    API-->>APP: estado actualizado
    APP->>SQL: actualiza la copia local
    APP-->>U: la entrada aparece como usada
    note over APP, U: El estado local es una copia, nunca la verdad: quien decide si una<br/>entrada sirve es el backend en el momento del escaneo.
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

1. **El canal ya tiene sesión, pero sigue sin compra ni billetera.** Hay navegación por pestañas,
   portada, lista con búsqueda, ficha con tramos y sesión nativa con par de tokens (SD-01 a SD-04),
   pero los CTA de compra siguen deshabilitados y remiten a la web. `fetchZones()` está definido y no
   se invoca desde ningún sitio.
2. **Las dependencias declaran una intención que el código no respalda.** `expo-notifications`,
   `expo-sqlite`, `react-native-maps` y `expo-linking` están instaladas y sin usar, y el `scheme`
   `ravenue` está declarado sin enlaces profundos configurados. Un enlace `/p/{code}` compartido por
   un promotor abre hoy el navegador, no la app.
3. **El patrón nativo ya resuelto no está extraído — y la duplicación ya ocurrió.** `apps/validator`
   implementa cliente HTTP con distinción entre fallo de red y respuesta de error, almacenamiento
   seguro del token, contexto de sesión con rehidratación y decodificación local de claims.
   `apps/mobile` reimplementó ese patrón por su cuenta (SD-02): dos copias de `decodeSegment`,
   dos `AuthProvider` y dos clientes HTTP. Extraerlo a un paquete compartido sigue pendiente.
4. **El validador descarta el refresh token.** `AuthProvider` guarda solo `tokens.accessToken` en
   `SecureStore` y, ante un 401, cierra sesión y manda a login. En una noche de puerta eso significa
   re-loguear a mitad de turno. **El canal del asistente no debe copiar ese patrón**: debe guardar el
   par completo y renovar.
5. **La rotación de un solo uso es peligrosa en móvil.** El backend revoca **toda** la familia de
   refresh del usuario cuando recibe un `jti` ya consumido, sin poder distinguir una carrera legítima
   de un robo. Varias pantallas despertando a la vez con el access token vencido disparan renovaciones
   paralelas: la segunda cierra la sesión del usuario en el móvil **y en la web**. El móvil del
   asistente ya implementa la mitigación completa (single-flight `refreshInFlight` + renovación
   anticipada con `AppState`, SD-03); el validador sigue sin renovar ningún token.
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
| 3 | Catálogo y ficha (SD-04) | Solo consume endpoints públicos que ya existen: es el tramo de menor riesgo |
| 4 | Billetera con copia local del token del QR (SD-06) | Es el valor diferencial del canal frente a la web móvil |
| 5 | Compra con clave de idempotencia persistida (SD-05) | Necesita sesión y ficha, y el backend ya la soporta |
| 6 | Registro de dispositivos y push (SD-07) | Requiere trabajo de backend nuevo, no solo de la app |
| 7 | Enlaces profundos y universales (SD-04, fase 3) | Cierra el circuito con los códigos de promotor |

---

## 11. Mantenimiento

- **Fuente de verdad funcional:** `../der_class/PROJECT_SPECS.md` (§5 cubre los canales nativos). Toda
  desviación se registra como ADR en `docs/adr/`.
- Este documento es mayoritariamente TO-BE: **cada diagrama que se implemente debe reescribirse como
  AS-IS en el mismo PR**, con los nombres reales de archivos y casos de uso, y moverse su fila de la
  tabla del §1.
- Antes de mergear, ejecutar el comando de validación de §3: los 7 diagramas deben renderizar.
- Cuando `apps/mobile` deje de ser un andamiaje, actualizar también la tabla del §2, que es lo que hoy
  justifica el enfoque del documento.
