# Rebrand y sesión renovable de `apps/validator`

**Fecha:** 2026-08-01 · **Rama:** `feat/rebrand-ravenue` · **Estado:** diseño aprobado, pendiente de plan

Llevar la app de puerta al Design System RAVENUE tomando `apps/mobile` como referencia, y de paso
cerrar la brecha de sesión que los propios diagramas ya señalan (`90-canales-moviles.md` §9-4): hoy el
validador descarta el refresh token, así que un 401 a mitad de turno lo manda a re-login.

---

## 1. Punto de partida

### 1.1 Qué hay hoy en `apps/validator`

| Archivo | Estado |
|---|---|
| `app/_layout.tsx` | `AuthProvider` + `Stack` con `headerTitle` "Ravenue Validador". Gate de sesión por `token`/`isReady`. |
| `app/index.tsx` | Título, contador de pendientes, enlace a `/scan`, botones `Sincronizar ahora` y `Cerrar sesión`. Estilos RN por defecto. |
| `app/login.tsx` | Email + contraseña, `TextInput` sin estilar, `Button` nativo, azul `#2563eb`. |
| `app/scan.tsx` | `CameraView` + banner inferior con paleta cruda (`#16a34a`, `#dc2626`, `#d97706`). |
| `lib/api-client.ts` | `NetworkError` frente a `ApiError`; `ApiError` solo lleva `status`. `login` y `validateQr`. |
| `lib/auth.ts` | Solo access token en `expo-secure-store`. `isValidatorToken` exige rol **y** vigencia a la vez. |
| `lib/auth-context.tsx` | Rehidratación, `runSync`, listener de NetInfo. Sin renovación. |
| `lib/offline-cache.ts` | Cola SQLite `pending_checkin` con `UNIQUE(qr_code)` e `INSERT OR IGNORE`. |
| `lib/logger.ts` | Logger compartido, ya redacta `qrCode`, `accessToken` y `refreshToken`. |
| Tests | **Ninguno.** No hay `vitest.config.ts`. |

Identidad ya migrada en esta rama: `app.json` (`name`, `slug`, `scheme`, `bundleIdentifier`, `package`,
`cameraPermission`), `headerTitle` y `APP` del logger. Queda solo la piel.

### 1.2 Qué aporta `apps/mobile` como referencia

`lib/theme.ts` (tokens RAVENUE dark-first, 70/20/10 carmín), `components/ui.tsx` (`Eyebrow`, `Chip`,
`Button`, `Field`, `SectionHead`, `LoadingState`, `ErrorState`, `EmptyState`), `lib/net.ts`
(`useIsOnline`), `lib/errors.ts` (`ApiError` problem+json), `lib/auth.ts` (par de tokens) y
`lib/auth-context.tsx` (single-flight de refresh + `AppState`). 25 tests Vitest sobre módulos puros.

### 1.3 Decisiones tomadas

| Decisión | Elegido |
|---|---|
| Alcance | Piel + sesión. No toca `apps/mobile`. Sin paquete compartido. |
| Veredicto en puerta | Overlay pleno, háptica, auto-cierre solo en `valid` |
| Sesión caída sin red | Sigue escaneando y encolando mientras el refresh esté vigente |
| Pantalla de inicio | Panel de turno con DS, ruta actual `inicio → escanear` |
| Cómo llega el DS | Copia de tokens y primitivos, como mobile copió de `globals.css` |
| Orden | Sesión primero, piel después |

---

## 2. Arquitectura del tramo de sesión

### 2.1 Contrato nuevo de `useAuth()`

```ts
status: 'restoring' | 'guest' | 'authenticated'   // hoy: token + isReady
claims: AccessClaims | null
getAccessToken(): Promise<string | null>           // hoy: token: string | null
signIn(email: string, password: string): Promise<void>
signOut(): Promise<void>
runSync(): Promise<number>
```

### 2.2 `lib/auth.ts`

Pasa a par de tokens. `ACCESS_KEY` **conserva** la clave actual
(`urnight_validator_access_token`); nace `REFRESH_KEY` (`urnight_validator_refresh_token`).

Este fichero queda **solo con lo que toca plataforma**: `getStoredTokens`, `storeTokens`, `clearTokens`
sobre `expo-secure-store`, y `NotValidatorError`. Toda la lógica pura de claims se muda a
`lib/session-rules.ts` (§4.1) y `auth.ts` la importa de allí — es lo que la hace testeable sin montar
Expo.

`isValidatorToken` se descompone en el módulo puro. Hoy exige rol **y** vigencia en la misma función,
lo que hace que un access vencido equivalga a sesión muerta. Con renovación eso deja de ser cierto, así
que pasan a consultarse por separado: `hasValidatorRole(claims)` y `isTokenFresh(token, skew = 30)`.
Los claims se decodifican aunque `exp` haya pasado, de modo que el rol sigue siendo legible al
rehidratar.

### 2.3 `lib/api-client.ts`

- `ApiError` gana `code` y `fieldErrors` de problem+json (hoy solo lleva `status`). Es lo que permite
  distinguir un refresh **rechazado** de un 5xx transitorio.
- Nacen `refreshRequest(refreshToken)` y `logoutRequest(refreshToken)` contra `POST /auth/refresh` y
  `POST /auth/logout` (`apps/api/.../auth.controller.ts:71` y `:80`), los mismos que usa mobile.
- **No** se copia `setTokenProvider`. Aquí solo hay un endpoint autenticado (`validateQr`): el token
  explícito por llamada sale más barato que la indirección.

### 2.4 `lib/auth-context.tsx`

- Mutex `refreshInFlight` idéntico al de mobile. La razón es §9-5: la rotación es de un solo uso y dos
  renovaciones en paralelo revocan **toda** la familia de refresh del usuario, incluida su sesión web.
- Renovación anticipada al volver a primer plano vía `AppState`: en puerta el teléfono entra y sale de
  suspensión entre escaneos.
- Rehidratación: hay sesión si el refresh está vigente por claims, aunque el access haya expirado.
- `runSync()` obtiene el token con `getAccessToken()`; si devuelve `null`, no sincroniza y reintenta en
  la siguiente oportunidad. El listener de NetInfo se mantiene.
- `signOut()` llama a `logoutRequest` best-effort y limpia el par local aunque la revocación falle.

### 2.5 Política de sesión offline

| Situación | Comportamiento |
|---|---|
| Access fresco | Se usa |
| Access vencido, refresh vigente, hay red | Renovar (single-flight) y continuar |
| Access vencido, fallo de **red** al renovar | `getAccessToken()` devuelve `null` **sin cerrar sesión**; el escaneo se encola |
| Refresh vencido por claims | Sesión muerta → login |
| `ApiError` 401 o 400 al renovar | Sesión muerta → login |

### 2.6 Cambio en `app/scan.tsx` que altera un flujo documentado

Hoy un `ApiError` 401 hace `signOut()` y manda a login, directo. Pasa a:

1. Pedir `getAccessToken()` (renueva si toca).
2. Si devuelve token, reintentar el escaneo **una** vez.
3. Si devuelve `null` por red, encolar como offline.
4. Solo si el refresh fue rechazado, cerrar sesión e ir a login.

Esto modifica la rama de 401 de **SD-11** en `docs/diagramas-secuencia/05-entradas-validacion.md`.

### 2.7 Qué no cambia

`lib/offline-cache.ts` no se toca por dentro; solo `syncPending` recibe el token fresco por llamada. El
fichero SQLite mantiene el nombre `urnight-validator.db`: renombrarlo abandonaría los check-ins
pendientes de sincronizar de cualquier dispositivo ya en uso.

---

## 3. Piel: DS y pantallas

### 3.1 Módulos nuevos

- **`lib/theme.ts`** — copia literal de los tokens de `apps/mobile/lib/theme.ts`.
- **`components/ui.tsx`** — solo `Eyebrow`, `Chip`, `Button`, `Field` y `LoadingState`. `SectionHead`,
  `ErrorState` y `EmptyState` no viajan: nadie los llamaría.
- **`lib/net.ts`** — copia de `useIsOnline`. NetInfo ya está instalado.

### 3.2 `app/_layout.tsx`

`Stack` con `contentStyle: color.bgRoot`, `headerStyle: color.bgBase`, `headerTintColor` y
`headerTitleStyle` en `color.textPrimary`. `StatusBar` en `light`. El gate lee `status`: `restoring`
pinta `LoadingState` en vez de dejar la pantalla en blanco. `scan` va con `headerShown: false`.

### 3.3 `app/login.tsx`

Espejo del login de mobile: `SafeAreaView` + `KeyboardAvoidingView` + `ScrollView`, `Eyebrow`
"PUERTA · RAVENUE", h1, dos `Field`, botón primario y caja de alerta en `errorSoft`. Valida con
`loginSchema` de `@urnight/contracts` antes de llamar al API. Mapeo de errores: conserva
`NotValidatorError` → "Esta cuenta no tiene permisos de validador." y suma `IDENTITY_ERROR_CODES`
(`INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`) y el 429.

### 3.4 `app/index.tsx` — panel de turno

```
┌──────────────────┐
│ PUERTA · RAVENUE │  Eyebrow
│                  │
│ Validación de    │  type.h1
│ puerta           │
│                  │
│  ● En línea      │  Chip (verde) / Sin conexión (ámbar)
│                  │
│ ┌─────────────┐  │
│ │ Pendientes 0│  │  superficie bgSurface
│ └─────────────┘  │
│                  │
│ [ Escanear QR  ] │  Button primario
│ [ Sincronizar  ] │  Button secundario, solo si cola > 0
│                  │
│   Cerrar sesión  │
└──────────────────┘
```

El chip se alimenta de `useIsOnline`. "Sincronizar ahora" solo aparece con cola y va **deshabilitado**
sin red: pulsarlo offline solo produciría un fallo silencioso. El contador sigue recontándose con
`useFocusEffect`, como hoy.

### 3.5 `app/scan.tsx` — veredicto

Cámara a pantalla completa. El veredicto es un overlay pleno sobre fondo semántico del DS:

| Veredicto | Fondo | Texto | Háptica | Cierre |
|---|---|---|---|---|
| `valid` | `color.success` | `color.bgRoot` | `Success` (1 vibración) | Automático a `VERDICT_AUTOCLOSE_MS = 1500`, con barra de progreso |
| `already_used`, `cancelled`, `invalid`, `error` | `color.error` | `color.textOnAccent` | `Error` (2 vibraciones) | Toque en "Escanear otro" |
| `offline` | `color.warning` | `color.bgRoot` | `Warning` | Toque en "Escanear otro" |

El contraste manda sobre la simetría: blanco sobre ámbar `#f59e0b` da ~2:1 y en puerta no se lee, así
que `success` y `warning` llevan texto obsidiana y solo `error` lleva texto blanco.

El encolado offline **también espera toque**: es ámbar, no es un "adelante", y el validador tiene que
enterarse de que ese ingreso quedó pendiente.

Contenido del overlay: marca (✓ / ✕ / reloj), título grande, el `message` que devuelve el backend y
`Ref ····` con los últimos 4 caracteres. Nada más: `qrValidationResponseSchema`
(`packages/contracts/src/checkout/qr.ts`) solo devuelve `result`, `ticketId`, `attendeeName` y
`message`, no hay `usedAt`, y `attendeeName` sale siempre `null`
(`validate-qr.use-case.ts:112`). El contenido del QR no se pinta ni se loguea (§6).

### 3.6 Dedupe con auto-cierre

Hoy `lastCode` bloquea el re-disparo del mismo QR mientras el banner está en pantalla. Al cerrarse
solo, la cámara vuelve a tener el mismo código delante y lo revalidaría al instante: segunda pasada que
el backend responde `already_used`, con vibración de rechazo y un pendiente falso en la cola si además
no hay red.

`lastCode` pasa a guardarse **con su instante** y el mismo código se ignora durante
`RESCAN_WINDOW_MS = 5000`. Un código distinto pasa de inmediato. Ambas constantes viven en
`lib/scan-rules.ts`, que es donde se prueban.

### 3.7 Dependencias nuevas

- `expo-haptics` (versión alineada con Expo SDK 54, vía `expo install`).
- `vitest` como `devDependency`, más el script `test` en `package.json`. El validador hoy no tiene ni
  uno de los dos.

Ninguna otra.

---

## 4. Pruebas

Vitest en entorno `node`, `include: ['lib/**/*.spec.ts']`, misma configuración que
`apps/mobile/vitest.config.ts`. Regla heredada: **lo que toca plataforma vive en un fichero aparte del
que se prueba**. `auth.ts` importa `expo-secure-store`, así que la lógica pura sale a dos módulos.

### 4.1 `lib/session-rules.ts`

Sin imports de Expo. Contiene `claimsOf`, `isTokenFresh(token, skew)`, `hasValidatorRole(claims)` y la
decisión de sesión de §2.5 como función pura.

Casos: decodificación base64url; `exp` con margen de 30 s; rol `validator` ausente; access vencido con
refresh vigente → renovar; refresh vencido → sesión muerta; fallo de red al renovar → seguir offline;
`ApiError` 401 → sesión muerta.

### 4.2 `lib/scan-rules.ts`

Sin imports de Expo. Ventana de dedupe y mapa de presentación del veredicto (fondo, color de texto,
marca, tipo de háptica, si auto-cierra).

Casos: mismo código dentro de la ventana → ignorar; mismo código fuera de la ventana → pasa; código
distinto → pasa siempre; `valid` auto-cierra y el resto no; `offline` no auto-cierra; `success` y
`warning` devuelven texto oscuro y `error` texto claro.

### 4.3 Verificación por tramo

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Al cerrar, además:

```bash
pnpm --filter @urnight/validator exec expo export --platform android
```

Confirma que `expo-haptics` resuelve en Metro — el mismo control que atrapó los problemas de `qrcode` y
`react-native-svg` en mobile. No se añaden rutas nuevas, así que el footgun de
`.expo/types/router.d.ts` (que `expo export` no regenera, solo `expo start`) no aplica.

### 4.4 Verificación en dispositivo

No automatizable; se documenta como checklist manual.

1. Login con cuenta sin rol `validator` → mensaje de permisos.
2. Escaneo válido → vibración simple, overlay verde, auto-cierre a 1,5 s.
3. El mismo QR dos veces seguidas dentro de la ventana → el segundo se ignora.
4. Modo avión → escaneo encola en ámbar → volver a red → sincroniza y el contador baja.
5. Access vencido sin red → la puerta sigue escaneando y encolando.
6. Refresh rechazado por el servidor → login.
7. Cerrar sesión → `POST /auth/logout` y vuelta a login.

---

## 5. Riesgos y fuera de alcance

### 5.1 Asumido

- **Re-login único en el despliegue.** Un dispositivo con la sesión actual tiene access guardado pero
  ningún refresh. La rehidratación lo verá como sesión incompleta y pedirá login una vez. Es preferible
  a arrastrar una sesión a medias.
- **La duplicación de §9-3 crece** con `theme.ts`, `ui.tsx` y `net.ts`. Es el precio de la opción
  elegida frente al paquete compartido.
- **La cola offline sigue sin techo ni caducidad** (`05-entradas-validacion.md` §11-8).

### 5.2 Fuera de alcance

- **`scannedAt` no se propaga.** El `TODO(scannedAt)` de `lib/api-client.ts:89` está **obsoleto**:
  `validateQrSchema` sí acepta `scannedAt` hoy (`packages/contracts/src/checkout/qr.ts:9`). Pero
  `ValidateQrUseCase` lo ignora — cero coincidencias en `apps/api/src/modules` —, así que enviarlo no
  cambiaría nada. La brecha §11-4 sigue abierta, por otro motivo del que dice el comentario.
- **`attendeeName` siempre `null`** (§11-5): en puerta no se puede contrastar el documento contra el
  titular. Condiciona el contenido del overlay, no se resuelve aquí.
- **Scope del validador por local o empresa, no por evento** (§11-6, TODO C1).
- **`apps/mobile` no se toca.**

---

## 6. Documentación que este cambio obliga a actualizar

No es opcional: el hook de diagramas lo exige y la serie documenta el AS-IS.

| Documento | Qué queda desfasado |
|---|---|
| `05-entradas-validacion.md` | **SD-11**: la rama de 401 de la fase 1 (ahora renueva y reintenta antes de mandar a login). **SD-10**: el paso final "banner verde para valid, rojo para el resto" pasa a overlay pleno. Fila "Cola offline" de la tabla de trazabilidad. |
| `90-canales-moviles.md` | §2.3, fila "Renovación del token": deja de ser `❌ tampoco lo hace el validador`. §9-4 y §9-5 pierden vigencia parcial. |

Validación obligatoria tras editar, según la skill `sincronizar-diagramas-secuencia`:

```bash
bash .claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh \
  docs/diagramas-secuencia/05-entradas-validacion.md
```

---

## 7. Orden de construcción

1. `lib/session-rules.ts` + su spec, y `vitest.config.ts` del validador.
2. `lib/auth.ts` al par de tokens; `lib/api-client.ts` con `code` en `ApiError`, `refreshRequest` y
   `logoutRequest`.
3. `lib/auth-context.tsx` con single-flight, `AppState` y la política de §2.5.
4. `app/scan.tsx`: solo el tramo de sesión (renovar → reintentar → encolar → login).
5. `lib/theme.ts`, `components/ui.tsx`, `lib/net.ts`.
6. `app/_layout.tsx` tematizado y gate por `status`.
7. `app/login.tsx` con el DS.
8. `app/index.tsx` panel de turno.
9. `lib/scan-rules.ts` + su spec; overlay de veredicto con háptica y auto-cierre.
10. Sincronización de diagramas (§6) y verificación final (§4.3).

Las pantallas van después de la sesión para escribirlas una sola vez contra `getAccessToken()`.
