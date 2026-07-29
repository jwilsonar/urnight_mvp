# Canales móviles — Aplicación del asistente

**Serie:** [Diagramas de secuencia](./README.md) · **Transversal** — canal *App Móvil* (§7 mapa C4 ↔ implementación de `PROJECT_SPECS.md`)

> **Alcance.** El canal móvil del asistente (`apps/mobile`), representado con **7 diagramas Mermaid**
> en formato *protocol data flow*, mismo estándar que el resto de la serie.
>
> **Advertencia de estado.** A diferencia de los otros documentos de la serie, aquí **casi todo es
> TO-BE**. `apps/mobile` es hoy un andamiaje: tres archivos de producto y una pantalla que hace ping a
> `/health`. Solo SD-01 documenta código existente. Los seis diagramas restantes son diseño propuesto,
> marcados como tales, y están calcados de dos fuentes que ya funcionan en este repo: la app de puerta
> (`apps/validator`, que resuelve sesión nativa, almacenamiento seguro y cola offline) y el consumidor
> web (`apps/web`, que resuelve catálogo, checkout y billetera).
>
> Fecha de levantamiento: 2026-07-28 · Rama `feat/rebrand-ravenue`.

---

## 1. Índice

| # | Diagrama | Estado |
|---|---|---|
| SD-01 | [Arranque de la aplicación](#sd-01--arranque-de-la-aplicación) | **AS-IS** — código existente |
| SD-02 | [Sesión nativa: login y almacenamiento](#sd-02--sesión-nativa-login-y-almacenamiento) | TO-BE |
| SD-03 | [Renovación del token y la carrera de rotación](#sd-03--renovación-del-token-y-la-carrera-de-rotación) | TO-BE |
| SD-04 | [Catálogo, ficha y enlace profundo](#sd-04--catálogo-ficha-y-enlace-profundo) | TO-BE |
| SD-05 | [Compra desde el móvil](#sd-05--compra-desde-el-móvil) | TO-BE |
| SD-06 | [Billetera con QR sin red](#sd-06--billetera-con-qr-sin-red) | TO-BE |
| SD-07 | [Registro de dispositivo y notificaciones](#sd-07--registro-de-dispositivo-y-notificaciones) | TO-BE |

---

## 2. Punto de partida real

### 2.1 Qué hay hoy en `apps/mobile`

| Archivo | Líneas | Contenido |
|---|---|---|
| `app/_layout.tsx` | 11 | `Stack` de expo-router con `StatusBar`. Idéntico al del validador. |
| `app/index.tsx` | 31 | Una pantalla: título, subtítulo *"Fase 1 (foundation)"* y el estado de `/health`. |
| `lib/api-client.ts` | 33 | `getJson` tipado con log de red, más `fetchHealth()` y `fetchZones()`. |
| `lib/logger.ts` | 65 | Logger compartido con el resto de apps nativas. |

No hay autenticación, ni navegación más allá de la pantalla raíz, ni consumo de catálogo:
`fetchZones()` está definido y **no se invoca desde ningún sitio**.

### 2.2 Qué declara la configuración

`app.json` y `package.json` describen una intención bastante más amplia que el código:

| Declarado | Uso actual |
|---|---|
| `scheme: "urnight"` | Sin enlaces profundos configurados |
| `expo-router` con `typedRoutes` | Una sola ruta |
| `expo-notifications` | Sin uso |
| `expo-sqlite` | Sin uso |
| `react-native-maps` | Sin uso |
| `expo-linking` | Sin uso |
| `@urnight/contracts` | Solo para el tipo `ZoneResponse` del fetcher no usado |

### 2.3 Qué ya está resuelto en la app hermana

`apps/validator` no es un andamiaje: implementa el patrón nativo completo contra el mismo API. El
canal del asistente debería partir de ahí en vez de reinventarlo.

| Pieza | `apps/validator` | `apps/mobile` |
|---|---|---|
| Cliente HTTP con `NetworkError` frente a `ApiError` | ✅ `lib/api-client.ts` | ⚠️ Solo distingue el fallo de red en el log |
| Token en almacenamiento seguro | ✅ `expo-secure-store` (Keychain o Keystore) | ❌ |
| Contexto de sesión con rehidratación al arrancar | ✅ `AuthProvider` | ❌ |
| Decodificación local de claims para gating de UX | ✅ `isValidatorToken` | ❌ |
| Detección de reconexión | ✅ `NetInfo` | ❌ |
| Cola local en SQLite | ✅ `offline-cache.ts` | ❌ (dependencia instalada) |
| Renovación del token | ❌ **tampoco lo hace el validador** — ver §9 | ❌ |

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

**AS-IS.** El único flujo que existe hoy, de punta a punta.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant APP as app/_layout.tsx
    participant SCR as app/index.tsx
    participant API as lib/api-client.ts
    participant EDGE as Edge API
    participant HC as HealthController

    note over U, SCR: Fase 1 · Montaje de la única pantalla
    U->>APP: abre la aplicación
    APP->>APP: Stack de expo-router con headerTitle UrNight
    APP->>SCR: renderiza la ruta raíz
    SCR-->>U: título, subtítulo "Fase 1 (foundation)" y estado "cargando…"

    note over SCR, HC: Fase 2 · Comprobación de vida del API
    SCR->>API: fetchHealth() dentro de useEffect
    API->>EDGE: GET /api/v1/health · sin cabecera de autorización
    EDGE->>HC: handler de salud
    HC-->>EDGE: estado de base de datos y caché
    alt respuesta correcta
        EDGE-->>API: 200 OK · { status, info }
        API-->>SCR: HealthResponse
        SCR-->>U: "API: ok"
    else respuesta no 2xx
        EDGE-->>API: código de error
        API->>API: log.warn con la ruta y el estado
        API-->>SCR: el cuerpo se devuelve igualmente
        note over API: getJson registra el fallo pero NO lanza ante un no-2xx:<br/>solo lanza si el fetch no llega a responder.
    else fallo de red
        API->>API: log.error con el mensaje del error
        API-->>SCR: throw
        SCR-->>U: "API: error (mensaje)"
    end
    note over U, HC: Aquí termina todo el producto móvil actual. No hay sesión,<br/>ni catálogo, ni compra, ni billetera. fetchZones() existe sin usarse.
```

---

## 5. Bloque 1 · Sesión nativa (TO-BE)

### SD-02 · Sesión nativa: login y almacenamiento

**TO-BE.** El móvil **no puede** reutilizar el flujo de la web: Auth.js con handoff de `Credentials`
es servidor a servidor. Tiene que hablar directo con el API, como ya hace el validador.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant SCR as Pantalla de login propuesta
    participant CTX as AuthProvider propuesto
    participant SEC as expo-secure-store
    participant API as api-client
    participant EDGE as Edge API

    note over U, SEC: Fase 1 · Rehidratación al arrancar
    U->>SCR: abre la aplicación
    CTX->>SEC: getItemAsync del par de tokens
    SEC-->>CTX: tokens guardados o null
    alt hay tokens válidos
        CTX->>CTX: decodifica los claims en local solo para gating de UX
        note over CTX: El servidor verifica la firma en cada petición. La lectura local<br/>de claims sirve para decidir qué pantalla mostrar, nada más.
        CTX-->>SCR: sesión rehidratada, va al catálogo
    else sin tokens o expirados
        CTX-->>SCR: pantalla de login

        note over U, EDGE: Fase 2 · Autenticación directa contra el API
        U->>SCR: correo y contraseña
        SCR->>API: login(email, password)
        API->>EDGE: POST /api/v1/auth/login · { email, password }
        note over EDGE: Ruta sensible: 10 peticiones por minuto por IP y por correo,<br/>fail-closed, con bloqueo de 15 minutos tras 5 fallos.
        alt credenciales inválidas
            EDGE-->>API: 401 · { code identity/invalid_credentials }
            API-->>SCR: ApiError 401
            SCR-->>U: mensaje genérico, sin revelar si la cuenta existe
        else cuenta bloqueada por intentos
            EDGE-->>API: 429 más Retry-After
            SCR-->>U: aviso de bloqueo temporal
        else credenciales correctas
            EDGE-->>API: 200 OK · AuthTokensResponse { accessToken, refreshToken, expiresIn }

            note over CTX, SEC: Fase 3 · Persistencia segura del PAR completo
            CTX->>SEC: setItemAsync del accessToken y del refreshToken
            note over CTX, SEC: Diferencia deliberada con el validador, que descarta el refresh<br/>token y obliga a re-login al vencer el access. Ver §9.
            SEC-->>CTX: guardado en Keychain o Keystore
            CTX-->>SCR: sesión iniciada
            SCR-->>U: catálogo del asistente
        end
    end

    note over U, EDGE: Fase 4 · Cierre de sesión
    U->>CTX: cerrar sesión
    CTX->>API: logout(refreshToken)
    API->>EDGE: POST /api/v1/auth/logout · { refreshToken }
    EDGE-->>API: 204 No Content
    note over API, EDGE: El móvil SÍ debe llamar a este endpoint, a diferencia de la web,<br/>que hoy no lo hace y deja el jti vivo en Redis hasta su TTL.
    CTX->>SEC: deleteItemAsync de ambos tokens
    CTX-->>U: vuelta a la pantalla de login
```

### SD-03 · Renovación del token y la carrera de rotación

**TO-BE.** El backend rota el refresh en un solo uso y, ante un `jti` ya consumido, **revoca toda la
familia de sesiones del usuario**. En móvil eso es un riesgo concreto: varias pantallas despiertan a
la vez.

```mermaid
sequenceDiagram
    autonumber
    participant P1 as Pantalla A
    participant P2 as Pantalla B
    participant MTX as Mutex de refresh propuesto
    participant API as api-client
    participant EDGE as Edge API
    participant RS as Redis · refresh store

    note over P1, RS: Escenario del problema, si NO hay mutex
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
    EDGE-->>API: 401 · { code identity/invalid_token }
    note over EDGE, RS: Detección de reuso: el backend no distingue una carrera legítima<br/>de un token robado, y hace lo correcto desde su punto de vista.<br/>Efecto en el usuario: se cierra su sesión en el móvil Y en la web.

    note over P1, RS: Diseño propuesto · una sola renovación en vuelo
    P1->>MTX: solicita token vigente
    P2->>MTX: solicita token vigente
    MTX->>MTX: si ya hay una renovación en curso, ambas esperan la misma promesa
    MTX->>API: refresh(refreshToken) una única vez
    API->>EDGE: POST /api/v1/auth/refresh · { refreshToken }
    EDGE->>RS: valida y rota el jti
    RS-->>EDGE: rotación correcta
    EDGE-->>API: 200 OK · nuevo par de tokens
    API-->>MTX: par nuevo
    MTX->>MTX: persiste el par y libera a quien esperaba
    MTX-->>P1: access token vigente
    MTX-->>P2: el MISMO access token vigente
    note over MTX: Patrón single-flight. Además conviene renovar de forma anticipada<br/>al volver del segundo plano, con margen, en vez de esperar al 401.
```

---

## 6. Bloque 2 · Descubrimiento y compra (TO-BE)

### SD-04 · Catálogo, ficha y enlace profundo

**TO-BE.** Todas las lecturas son públicas y ya existen: el móvil consume los mismos endpoints que el
consumidor web, con los mismos tipos de `@urnight/contracts`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Asistente
    participant OS as Sistema operativo
    participant APP as Navegación de la app
    participant CACHE as Caché local propuesta
    participant API as api-client
    participant EDGE as Edge API

    note over U, EDGE: Fase 1 · Catálogo y búsqueda
    U->>APP: abre el listado de eventos
    APP->>CACHE: consulta la copia local
    alt copia fresca
        CACHE-->>APP: eventos cacheados, pintado inmediato
    else sin copia o vencida
        APP->>API: getEvents con q, zona, género y etiqueta
        API->>EDGE: GET /api/v1/events con la query
        EDGE-->>API: 200 OK · EventResponse[]
        API-->>CACHE: guarda la copia con su marca de tiempo
        CACHE-->>APP: eventos
    end
    APP-->>U: tarjetas de evento
    note over APP, EDGE: El API ya soporta limit y offset en eventos, así que el listado<br/>puede pasar a scroll infinito sin tocar el backend.

    note over U, EDGE: Fase 2 · Ficha del evento
    U->>APP: entra a un evento
    par Detalle
        APP->>API: getEventBySlug(slug)
    and Entradas
        APP->>API: getEventTicketTypes(eventId)
    and Reseñas
        APP->>API: getReviews con eventId
    end
    API->>EDGE: tres GET públicos en paralelo
    EDGE-->>API: 200 OK en cada uno
    API-->>APP: evento, tramos y reseñas
    APP-->>U: ficha con precio desde, disponibilidad y botón de compra

    note over OS, APP: Fase 3 · Enlace profundo del código de promotor
    U->>OS: pulsa un enlace WEB_PUBLIC_URL más /p/{code} recibido por mensajería
    alt la app tiene el enlace asociado
        OS->>APP: abre la app con la ruta /p/{code}
        APP->>API: resuelve el código de canje
        EDGE-->>API: 200 OK · oferta con isFree y savings
        APP-->>U: checkout con la entrada precargada
    else la app no está asociada al dominio
        OS-->>U: abre el navegador
        note over OS, APP: Estado actual: el scheme urnight está declarado en app.json pero<br/>no hay enlaces universales configurados, así que hoy siempre gana<br/>el navegador. Ver §9.
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

1. **La aplicación del asistente es un andamiaje.** Tres archivos de producto, unas 75 líneas: una
   pantalla que hace ping a `/health`. No hay sesión, catálogo, compra ni billetera. `fetchZones()`
   está definido y no se invoca desde ningún sitio.
2. **Las dependencias declaran una intención que el código no respalda.** `expo-notifications`,
   `expo-sqlite`, `react-native-maps` y `expo-linking` están instaladas y sin usar, y el `scheme`
   `urnight` está declarado sin enlaces profundos configurados. Un enlace `/p/{code}` compartido por
   un promotor abre hoy el navegador, no la app.
3. **El patrón nativo ya resuelto no está extraído.** `apps/validator` implementa cliente HTTP con
   distinción entre fallo de red y respuesta de error, almacenamiento seguro del token, contexto de
   sesión con rehidratación, decodificación local de claims y detección de reconexión. Nada de eso
   vive en un paquete compartido, así que el móvil del asistente lo duplicará salvo que se extraiga
   antes.
4. **El validador descarta el refresh token.** `AuthProvider` guarda solo `tokens.accessToken` en
   `SecureStore` y, ante un 401, cierra sesión y manda a login. En una noche de puerta eso significa
   re-loguear a mitad de turno. **El canal del asistente no debe copiar ese patrón**: debe guardar el
   par completo y renovar.
5. **La rotación de un solo uso es peligrosa en móvil.** El backend revoca **toda** la familia de
   refresh del usuario cuando recibe un `jti` ya consumido, sin poder distinguir una carrera legítima
   de un robo. Varias pantallas despertando a la vez con el access token vencido disparan renovaciones
   paralelas: la segunda cierra la sesión del usuario en el móvil **y en la web**. Requiere un
   *single-flight* en el cliente y, preferiblemente, renovación anticipada al volver del segundo
   plano.
6. **No existe registro de dispositivos.** Cero coincidencias de token de dispositivo en todo el
   repositorio: no hay tabla, ni endpoint, ni caso de uso. `PushPort` está cableado a `LogPushAdapter`
   y escribe en el log. El canal de notificaciones está abierto por el lado del worker y cerrado por
   el lado del dispositivo.
7. **El móvil no puede reutilizar la sesión de la web.** Auth.js con handoff de `Credentials` es
   servidor a servidor por diseño. El móvil habla directo con `/auth/login`, `/auth/refresh` y
   `/auth/logout`, igual que el validador. Conviene documentarlo para que no se intente lo contrario.
8. **El móvil sí debería llamar a `POST /auth/logout`.** La web hoy no lo hace y deja el `jti` vivo en
   Redis hasta su TTL. Es una oportunidad de no arrastrar la misma brecha al canal nuevo.
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
| 2 | Sesión con par de tokens, *single-flight* de renovación y logout real (SD-02, SD-03) | Sin sesión no hay billetera ni compra, y la carrera de rotación rompe también la web |
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
