# Canales móviles — Compra, Entradas y enlace de promotor

**Fecha:** 2026-08-01 · **Rama:** `feat/rebrand-ravenue` · **App:** `apps/mobile`

Diseño validado para implementar tres flujos hoy TO-BE de
[`docs/diagramas-secuencia/90-canales-moviles.md`](../../diagramas-secuencia/90-canales-moviles.md):
**SD-05 (compra)**, **SD-06 (billetera, renombrada Entradas)** y **SD-04 fase 3 (enlace profundo del
código de promotor)**.

---

## 1. Punto de partida

`apps/mobile` tiene navegación por pestañas, catálogo público, ficha de evento y sesión nativa con
par de tokens (SD-01 a SD-04 fase 2). No tiene compra, ni entradas, ni enlaces profundos.

El backend, en cambio, ya soporta casi todo lo que falta:

| Flujo | Backend | Móvil |
|---|---|---|
| SD-05 Compra | `POST /orders/checkout` (con `Idempotency-Key`), `POST /ticket-holds`, `DELETE /ticket-holds/{id}` | — |
| SD-06 Entradas | `GET /tickets/me` → `TicketResponse[]` con `qrCode`, `qrImageKey` y datos del evento | pantalla vacía |
| SD-04 f3 Enlace | `GET /redemption-codes/{code}` y `POST /redemption-codes/{code}/click`, ambos públicos | `scheme` declarado sin linking |

### 1.1 Desfase del propio diagrama

**SD-05 está desactualizado respecto al backend.** Describe la compra como un `POST` con clave de
idempotencia y nada más, pero el checkout real gira sobre **ticket-holds con TTL**: la web crea un
hold al entrar (`use-checkout-form.ts:133`), lo reemplaza con `replaceHoldId` al cambiar tramo o
cantidad, lo libera al salir y manda `holdId` dentro de `items[]`. El diagrama se reescribe
incorporando la reserva de cupo.

En sentido contrario, la web **no manda** `Idempotency-Key` hoy pese a que el API la soporta. El
móvil será el primer cliente que la use, y es donde más falta hace.

### 1.2 Huecos en la capa cliente del móvil

Bloquean cualquiera de los tres flujos:

- `request()` en `lib/api-client.ts` solo acepta `GET|POST`, sin `DELETE` ni cabeceras extra: no
  puede liberar holds ni mandar `Idempotency-Key`.
- No hay wrapper que inyecte el access token del `AuthProvider`; cada llamada lo recibe suelto.
- No hay resolución de object storage. `components/flyer.tsx` acepta `url` y hoy siempre recibe
  `null`: la app no muestra ni una imagen.
- Faltan librerías: render de QR, brillo de pantalla y detección de red.

---

## 2. Alcance

**Dentro:** SD-05, SD-06 completo (incluida operación sin red) y SD-04 fase 3 con scheme propio.

**Fuera:**

- **SD-07 push.** Requiere backend nuevo: no existe tabla de dispositivos, ni endpoint, ni caso de
  uso. `PushPort` está cableado a `LogPushAdapter`.
- **Enlaces universales verificados.** Exigen dev build (`eas.json`), dominio web desplegado y
  `assetlinks.json` / `apple-app-site-association` servidos desde él. Se deja la configuración
  escrita e inerte.
- **Extracción del patrón nativo a un paquete compartido** (§10 paso 1 del doc). La duplicación con
  `apps/validator` sigue registrada como brecha; el trabajo de este ciclo es específico del canal del
  asistente y no se comparte con el validador.

---

## 3. Decisiones

| Decisión | Elegida | Por qué |
|---|---|---|
| Checkout | Holds + idempotencia (espejo de la web) | Un móvil rellenando 4 asistentes tarda minutos: sin reserva de cupo, un 409 tras el formulario es una compra perdida. El hold ya existe en el backend |
| Entradas | SD-06 completo, con operación sin red | El caso de uso es la puerta de una discoteca, donde puede no haber cobertura. Es el valor diferencial frente a la web móvil |
| Enlace profundo | Scheme propio ahora, universal después | `ravenue://p/{code}` funciona y se prueba hoy sin dev build ni dominio |
| Paquete compartido | No en este ciclo | Meter `apps/validator` en el blast radius no aporta a este alcance |
| Generador de QR | `qrcode` (misma librería que la web) sobre `react-native-svg` | Codificación idéntica a la web garantizada. `toString({type:'svg'})` es puro JS, sin canvas |
| Validación de formularios | `safeParse` de `@urnight/contracts` con `useState` | Es el patrón que ya usa `app/login.tsx`. `react-hook-form` no está en el móvil |

**Dependencias nuevas:** `react-native-svg`, `qrcode` + `@types/qrcode`, `expo-brightness`,
`expo-crypto`, `@react-native-community/netinfo` (versión `11.4.1`, la misma que el validador).
Todas funcionan en Expo Go. `expo-sqlite` y `expo-linking` ya están instaladas sin usar.

---

## 4. Capa base

Cinco módulos con una responsabilidad cada uno, que no se conocen entre sí salvo por su interfaz.

### 4.1 `lib/api-client.ts` (ampliar)

- `request()` acepta `DELETE` y `headers` extra.
- Distingue `NetworkError` de `ApiError`. SD-05 y SD-06 dependen de esa distinción: un fallo de red
  se reintenta, una respuesta del servidor no.
- `authed<T>()` obtiene el token de un proveedor registrado por `AuthProvider` al montar
  (`setTokenProvider(getAccessToken)`).

> **Invariante de dependencias:** `api-client` **no** importa `auth-context`; hoy la dependencia va
> en sentido contrario y hay que mantenerla así. Por eso el token entra por inyección, no por import.

- Funciones nuevas: `createTicketHold`, `releaseTicketHold`, `checkout`, `fetchMyTickets`,
  `resolveRedemptionCode`, `registerRedemptionClick`.

### 4.2 `lib/storage.ts` (nuevo)

`resolveStorageUrl(key: string | null): string | null` — key de S3 a URL absoluta. Base desde
`EXPO_PUBLIC_STORAGE_URL`, derivada del `hostUri` de Metro cuando no está definida, igual que hace
`resolveApiUrl()`. Una URL absoluta entra y sale igual. Espejo de `resolve()` en
`apps/web/lib/storage/storage-context.tsx`.

Desbloquea imágenes en toda la app, no solo en Entradas.

### 4.3 `lib/local-db.ts` (nuevo)

Una base `expo-sqlite` con apertura y migración únicas, como `offline-cache.ts` del validador. Dos
tablas independientes:

- `ticket_cache(id TEXT PRIMARY KEY, payload TEXT, synced_at TEXT)` — copia de las entradas.
- `checkout_draft(event_id TEXT PRIMARY KEY, idempotency_key TEXT, dto TEXT, status TEXT, created_at TEXT)`
  — borrador y clave de idempotencia. `status` ∈ `draft | sent`.

Que compartan fichero es un detalle de implementación: los consumidores ven dos APIs separadas
(`tickets-cache.ts` y `checkout-draft.ts`), cada una con sus funciones puras de reconciliación.

### 4.4 `lib/net.ts` (nuevo)

Estado online con `@react-native-community/netinfo` y hook `useIsOnline()`.

### 4.5 `components/qr.tsx` (nuevo)

Render del QR: genera SVG con `qrcode` y lo pinta con `react-native-svg`. Prefiere `qrImageKey`
resuelto por `lib/storage.ts` **solo si hay red**; en cualquier otro caso dibuja desde el token
`qrCode`. Ambos codifican lo mismo.

---

## 5. SD-06 · Pestaña Entradas

### 5.1 Renombrado

`app/(tabs)/billetera.tsx` → `app/(tabs)/entradas.tsx`, con etiqueta e icono actualizados en
`app/(tabs)/_layout.tsx`. Renombrado de ruta, no alias: `typedRoutes` regenera y cualquier
referencia vieja falla en `typecheck`.

### 5.2 Lista

Tres estados de sesión y dos de red:

| Estado | Comportamiento |
|---|---|
| Invitado | `EmptyState` con acción "Ingresar" al modal `/login`, igual que hace hoy Cuenta |
| Con sesión, con red | `authed('/tickets/me')`, pinta las entradas y **escribe la copia local** |
| Con sesión, sin red | `NetworkError` cae a la copia local, con aviso persistente "mostrando datos guardados" y la hora de la última sincronización |
| Sin red y sin copia | `EmptyState` explicando que hace falta conexión la primera vez |

Cada fila: flyer vía `resolveStorageUrl(eventFlyerKey)`, nombre del evento, fecha en `es-PE`, tipo de
entrada, nombre del asistente y estado. Las `used`, `cancelled` y `expired` van atenuadas y
agrupadas debajo de las vigentes.

### 5.3 Detalle a pantalla completa — `app/entrada/[id].tsx`

Lee de la caché local primero (el caso de uso es la puerta, sin red) y refresca si hay conexión.
Muestra QR grande, nombre del asistente, evento, tramo y estado.

- **Brillo:** `expo-brightness` sube al máximo al enfocar y **restaura el valor previo al salir**,
  incluido cuando la app pasa a segundo plano con la entrada abierta. Sin la restauración, la app
  deja el teléfono al 100% y quema batería en la cola.
- Si el estado no es `valid`, un sello sobre el QR: mostrar un código ya usado confunde a quien
  escanea.

### 5.4 Reconciliación

Un listener de `NetInfo` y el `useFocusEffect` de la lista disparan el refetch. La copia local nunca
decide: si el backend dice `used`, la caché se sobrescribe. Una entrada que ya no aparece en la
respuesta se borra de la caché.

> **Invariante:** la caché guarda el **token** `qrCode`, nunca la imagen. Pesa nada y permite dibujar
> el QR sin red. El estado local es una copia: quien decide si una entrada sirve es el backend en el
> momento del escaneo.

---

## 6. SD-05 · Compra

### 6.1 Entrada al flujo

El CTA de `app/evento/[slug].tsx` deja de estar deshabilitado: con sesión navega a
`/comprar/{eventId}`; sin sesión abre el modal `/login` y vuelve al mismo destino al autenticarse.

### 6.2 Vista y lógica separadas

`app/comprar/[eventId].tsx` es la vista. Toda la máquina de estados vive en `lib/use-checkout.ts`.
Es el mismo corte que la web hace entre `CheckoutClient` y `use-checkout-form.ts`, y es lo que hace
testeable el ciclo de vida del hold sin montar pantalla.

### 6.3 Formulario

Estado con `useState` y validación con `createOrderSchema` y `attendeeInputSchema` de
`@urnight/contracts` vía `safeParse`, con errores por campo en el componente `Field`. Contiene:

- Selector de tramo entre los `active` con `remaining > 0`.
- Lista de asistentes de 1 a `min(remaining, maxPerUser ?? 10)`.
- Casilla "Soy yo" que precarga desde `GET /auth/me`, **solo si la cuenta trae `documentType`,
  `documentNumber` y `birthDate`** (las altas por Google no los tienen).
- Método de pago: `card`, `yape` o `plin`.
- Campo de código promocional, precargado si se llegó por enlace de promotor.

### 6.4 Ciclo de vida del hold

- Un efecto sobre `(ticketTypeId, cantidad)` crea o reemplaza el hold con `replaceHoldId`.
- Las llamadas se serializan en una cadena de promesas con contador de versión: sin eso, dos cambios
  rápidos de cantidad dejan holds huérfanos.
- Al desmontar, `DELETE /ticket-holds/{id}` si sigue `active`.
- Cuenta atrás desde `expiresAt`. Al expirar, el hold se recrea con la siguiente acción del usuario
  en vez de bloquear la pantalla.
- El submit se rechaza en local si el hold no coincide con el tramo y la cantidad del formulario.

### 6.5 Idempotencia

Antes del primer envío se persiste en `checkout_draft` una clave (`expo-crypto.randomUUID()`) junto
al DTO, con estado `sent`. Se manda como cabecera `Idempotency-Key`.

- `NetworkError` → reintento con **la misma clave**, con backoff acotado. Agotados los reintentos,
  botón manual que reutiliza la clave.
- Al abrir la app con un borrador en estado `sent`, se reenvía con la misma clave: si la primera
  petición llegó, el backend reproduce la orden en vez de duplicarla. Esto convierte "se me cayó la
  red al pagar" en algo recuperable.
- Respuestas del servidor **no se reintentan nunca**. Mensaje en español por `code` de
  `CHECKOUT_ERROR_CODES`: `stock-locked`, `payment-rejected`, `hold-expired`, `hold-not-found`,
  `insufficient-stock`, `insufficient-capacity`, `max-per-user-exceeded`, `attendee-underage`,
  `event-not-on-sale`, `ticket-type-unavailable`.

### 6.6 Éxito

Estado de éxito en la misma pantalla: código de orden, total y entradas emitidas con su QR.

**Las entradas devueltas se escriben en `ticket_cache` al instante**, así que quien compra camino a
la puerta ya tiene el QR disponible sin red. Se borra el borrador y su clave. Acción "Ver mis
entradas" lleva a la pestaña Entradas.

---

## 7. SD-04 fase 3 · Enlace profundo del código de promotor

### 7.1 Ruta `app/p/[code].tsx`

Resuelve `GET /redemption-codes/{code}` (público, sin sesión) y dispara
`POST /redemption-codes/{code}/click` como *fire-and-forget*: la atribución del promotor no debe
bloquear la pantalla ni romperla si falla.

Pinta la oferta con `promoterName`, `isFree`, `savings`, evento y tramo. El CTA lleva a
`/comprar/{eventId}` con el tramo preseleccionado y el código precargado en `promoCode`, igual que
la web pasando `presetCode`. Con `valid: false`, muestra `reason` y un enlace al evento si viene.

### 7.2 Linking

`expo-router` resuelve `ravenue://p/{code}` solo con que exista el fichero de ruta y el `scheme` de
`app.json`, que ya está declarado. En Expo Go se prueba con `exp://{host}/--/p/{code}`.

Se dejan escritos en `app.json` el `ios.associatedDomains` y el `android.intentFilters` del dominio
web, **inertes hasta que haya dev build y el dominio sirva `assetlinks.json` y
`apple-app-site-association`**. Queda anotado como brecha abierta en el §9 del doc de diagramas, no
como hecho consumado.

---

## 8. Verificación

### 8.1 Automática

`pnpm --filter @urnight/mobile typecheck` y `pnpm --filter @urnight/mobile lint` en cada paso.

El móvil hoy no tiene pruebas. Se añade un `vitest.config.ts` mínimo que cubre **solo módulos
puros**, sin renderer de React Native:

- Mapeo de `code` de `CHECKOUT_ERROR_CODES` a mensaje.
- Política de reintento: qué error se reintenta y cuál no.
- Máquina del borrador de idempotencia (`draft` → `sent` → borrado).
- Reconciliación de `ticket_cache`: sobrescritura, borrado de ausentes.

Son las cuatro piezas donde un fallo silencioso cobra dos veces o deja al usuario sin entrada en la
puerta.

### 8.2 Manual, en dispositivo

| Caso | Resultado esperado |
|---|---|
| Compra completa | Orden creada, entradas con QR, borrador borrado |
| Cortar la red entre el `POST` y la respuesta | Reintento con la misma clave, **una sola orden** |
| Cerrar la app a mitad del envío y reabrir | Reenvío con la misma clave, orden reproducida |
| Dejar expirar el hold | Aviso y recreación con la siguiente acción |
| Cambiar tramo y cantidad rápido | Un solo hold activo al final |
| Modo avión en Entradas | Copia local con aviso de datos guardados |
| Salir del QR y volver a otra pantalla | Brillo restaurado al valor previo |
| `npx uri-scheme open ravenue://p/CODE` | Abre la pantalla de la oferta |

---

## 9. Documentación en el mismo PR

`docs/diagramas-secuencia/90-canales-moviles.md`:

- **SD-05 reescrito incorporando la reserva de cupo.** Es la desviación más grande entre doc y
  código: hoy el diagrama la ignora por completo.
- SD-06 y SD-04 fase 3 pasados a AS-IS, con nombres reales de fichero.
- Tabla del §1, inventario del §2.1, configuración del §2.2, comparación con el validador del §2.3.
- §9 brechas: cierra la 1 (compra y billetera) y parte de la 2 (dependencias sin usar); mantiene
  abiertas la 3 (paquete compartido), la 6 (push) y la parte de enlaces universales de la 2.
- §10 orden de construcción: pasos 3, 4, 5 y 7 tachados como hechos.

Más el `README.md` de la serie, que hoy describe el doc móvil como "casi todo TO-BE".

Antes de mergear, los 7 diagramas deben renderizar con el comando de validación del §3.

---

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Android mata la app con un hold activo | El hold expira solo por TTL; no hay fuga de stock permanente. El borrador persistido permite retomar |
| `expo-brightness` deja el brillo alto si la app muere con el QR abierto | Restauración en `blur`, en el cleanup del efecto y en el cambio de `AppState` |
| La clave de idempotencia se reutiliza para un DTO distinto | La clave se guarda junto al DTO y se descarta si el usuario cambia tramo, cantidad o asistentes |
| El backend no expone base pública de storage al móvil | `EXPO_PUBLIC_STORAGE_URL` con derivación desde `hostUri`, mismo mecanismo ya probado para el API |
| Deriva entre el checkout web y el móvil | Ambos validan con los mismos esquemas de `@urnight/contracts`; el diagrama SD-05 queda como contrato legible de los dos |
