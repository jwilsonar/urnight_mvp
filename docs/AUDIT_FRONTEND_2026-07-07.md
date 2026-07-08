# Auditoría Frontend — `apps/web` (2026-07-07)

Auditoría de la aplicación web (Next.js 16 App Router) cubriendo: manejo de estado, arquitectura, código limpio, consumo de endpoints, autenticación, seguridad, UI/UX y carga de imágenes. Complementa `docs/AUDIT_2026-07-02.md` (auditoría de API; los códigos M10/B8 citados en comentarios provienen de ella).

Todos los hallazgos fueron verificados contra el código real (web y API) antes de entrar al plan.

---

## 1. Diagnóstico

### 1.1 Veredicto general

La base es de calidad alta y muy consistente: no hay hallazgos estructurales. Los problemas reales se concentran en (a) endurecimiento de seguridad ausente (headers/CSP, sesión expirada), (b) el requisito de drag-and-drop incumplido en los flujos de **creación**, y (c) dos componentes outlier que divergen del patrón del proyecto.

### 1.2 Fortalezas (preservar)

| Área | Evidencia |
|---|---|
| Higiene de tipos | 0 `any`, 0 `@ts-ignore`, 0 `eslint-disable`, 0 `console.*` fuera de `lib/logger.ts`. Toda la I/O tipada con `@urnight/contracts`. |
| Data-fetching | 0 `fetch()` inline fuera de `lib/api/`; 0 fetching en `useEffect`; server-state 100 % en TanStack Query con `queryKeys` centralizadas (`lib/api/query-keys.ts`). |
| Server/Client split | 43 de 46 páginas son Server Components con ISR; capa `lib/api/` (20 archivos, un dominio por archivo) con `ApiError` tipado sobre RFC 7807. |
| Formularios | 22 formularios con react-hook-form + `zodResolver` sobre esquemas de `@urnight/contracts`; `useApiMutation` centraliza toasts, `fieldErrors` → RHF e invalidación. |
| Auth | Handoff de tokens server→server (el refresh token nunca toca el browser); re-verificación contra `/auth/me` en `authorize`; redacción de secretos en logs; gates de rol server-side por panel (`requireRole`). |
| UX base | Cobertura amplia de `loading.tsx` (18) y `error.tsx` (16); skeletons/empty states compartidos; Radix maneja focus-trap en modales; tablas admin con `overflow-x-auto`; nav móvil con `Sheet`. |
| Multi-tenant | Verificado en API: `create-local.use-case.ts:31-33` re-valida `companyId` del body contra el claim del JWT (`TenantForbiddenError`) con test de regresión. El front no es autoritativo. |

### 1.3 Hallazgos por severidad

#### ALTA

| # | Hallazgo | Ubicación |
|---|---|---|
| A1 | **Sin headers de seguridad**: no hay CSP, X-Frame-Options, HSTS, Referrer-Policy ni Permissions-Policy. Combinado con A3, un XSS exfiltra un Bearer válido contra el API; sin frame-ancestors → clickjacking. | `apps/web/next.config.ts` (falta `headers()`) |
| A2 | **`AUTH_SECRET="urnight-secret"`** (débil/predecible) en `.env` local; sin validación de arranque. Si se reutilizara en prod, permite forjar la cookie de sesión NextAuth → bypass de auth completo. | `apps/web/.env:8` (gitignoreado) |
| A3 | **El requisito de drag-and-drop se incumple en los flujos de creación.** `create-local-dialog.tsx:196-210` pide la portada como `<Input type="url">`; `create-event-dialog.tsx` tiene `flyerUrl` en defaults (línea 58) pero **no renderiza ningún campo** — los eventos se crean sin flyer y hay que abrir "Editar" para subirlo. El DnD (`MediaDropzone`, react-dropzone) existe y es bueno, pero solo se usa en galería de local y edición de evento. | `components/admin/create-local-dialog.tsx`, `create-event-dialog.tsx` |

#### MEDIA

| # | Hallazgo | Ubicación |
|---|---|---|
| M1 | **`session.accessToken` (JWT del backend) expuesto al browser** vía `useSession` / `GET /api/auth/session` (43 componentes lo leen). Mitigable con CSP fuerte; alternativa BFF descartada por costo (ver ADR propuesto). | `lib/auth.ts:120`, `types/next-auth.d.ts:11` |
| M2 | **Sin recuperación de sesión expirada en cliente**: al fallar el refresh, `refreshAccess` marca `token.error` pero no limpia el accessToken viejo; el cliente sigue enviándolo y el 401 solo produce un toast, sin re-login. El server sí redirige (`requireAccessToken`). | `lib/auth.ts:191-208`, `lib/api/use-api-mutation.ts` |
| M3 | **`proxy.ts` solo verifica presencia de cookie**, no firma ni rol; la seguridad real depende de que toda ruta privada cuelgue de un layout con `requireRole`. Riesgo al añadir páginas fuera de layouts gateados; matcher sincronizado a mano. | `proxy.ts:9-21` |
| M4 | **`isSafeInternalPath` débil**: solo bloquea prefijo `//`; no cubre `/\evil.com`, control-chars ni `/%2F` → open redirect residual en `callbackUrl`. | `lib/utils/paths.ts:6-8` |
| M5 | **`<img>` crudo bypassa `StorageImage`** en la galería admin, para el mismo `LocalImageResponse.url` que el resto resuelve vía storage-context. Si el API devuelve keys → imágenes rotas + salta la política `unoptimized`. | `components/admin/local-images-manager.tsx:198` |
| M6 | **Acciones destructivas sin confirmación**: eliminar imagen y desasignar evento de promotor mutan al instante, sin diálogo ni undo. No existe `AlertDialog` en `packages/ui`. | `local-images-manager.tsx:164`, `assign-event-dialog.tsx:143` |
| M7 | **`edit-event-dialog.tsx` (525 líneas)** es el único formulario sin RHF+Zod: `useState` manual + validación por toast (sin errores inline), con helpers de fecha, normalización NFD y `ChipSelect` embebidos. Auto-marcado `TODO(DRY)` en :157-159. | `components/admin/edit-event-dialog.tsx` |
| M8 | **Subidas sin cancelar/reintentar**: XHR sin `AbortController`; ítem fallido queda en "error" sin retry; galería sin thumbnail pre-subida; `width`/`height` nunca se envían aunque `confirmLocalImageSchema` los soporta. | `lib/api/uploads.ts`, `local-images-manager.tsx` |

#### BAJA

| # | Hallazgo | Ubicación |
|---|---|---|
| B1 | `apiFetch` sin timeout/`AbortSignal` → API colgada bloquea la petición indefinidamente. | `lib/api/client.ts` |
| B2 | Listados consumer sin paginación (renderizan todo lo que devuelva el backend). | `app/(consumer)/events/page.tsx` |
| B3 | `checkout-client.tsx` (395 líneas) concentra dos flujos (pago + entrada gratis) con reglas de negocio inline. | `components/checkout/checkout-client.tsx` |
| B4 | `app/onboarding/` sin `loading.tsx` / `error.tsx` propios. | `app/onboarding/` |
| B5 | `packages/ui` sin primitivas comunes (AlertDialog, Progress, Tooltip, Popover, Switch) → barras de progreso y chips hechos a mano → deriva de diseño. | `packages/ui/src/index.ts` |
| B6 | Lectura manual de `session?.accessToken` repetida en ~45 componentes; `useTokenAction` existe pero solo se adopta en ~2 sitios. | transversal |
| B7 | Estrategia de revalidación dual (React Query invalidate vs `router.refresh()`); `next: { tags }` existe en `client.ts` pero `revalidateTag` nunca se usa. | transversal |
| B8 | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` expuesta al browser (inevitable para Maps JS); requiere restricción por HTTP-referrer en GCP. | `.env:13`, `components/locals/local-map.tsx` |
| B9 | Sin cropper/enforcement de aspect ratio en imágenes (solo recorte visual `object-cover`); `alt=""` en miniaturas de contenido; input del dropzone sin `aria-label`. | `media-dropzone.tsx`, galería |

#### Descartados tras verificación

- **`companyId` en body de CreateLocal**: el backend re-valida contra el claim (`create-local.use-case.ts:31-33` + test). El body es necesario para que `super_admin` cree locales de cualquier empresa. Informativo, sin fix.
- **Errores silenciados**: los `.catch(() => null)` son degradación deliberada de datos opcionales en Server Components; no hay silenciado peligroso.

---

## 2. Plan de correcciones

Verificación transversal tras cada fase: `pnpm --filter @urnight/contracts build` (si se tocaron contratos) → `pnpm lint && pnpm typecheck && pnpm --filter @urnight/api test`. La web no tiene suite de tests: verificación por typecheck + manual.

### FASE P0 — Crítico (~2 días)

#### P0.1 AUTH_SECRET + validación de env (S, 1-2 h) — corrige A2

- Operativo: generar secreto (`openssl rand -base64 32`), reemplazar en `apps/web/.env`; rota sesiones activas.
- Nuevo `apps/web/lib/config/env.schema.ts` replicando el patrón Zod de `apps/api/src/config/env.schema.ts`: `AUTH_SECRET` min 32 (fail-fast en prod, warn en dev, rechazar valores conocidos débiles), `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_STORAGE_URL` como URL con defaults actuales.
- Nuevo `apps/web/instrumentation.ts`: `register()` → `validateEnv(process.env)` solo en `NEXT_RUNTIME === 'nodejs'` (único hook que corre al boot en standalone).
- Actualizar `.env.example` con comando de generación.

#### P0.2 Sesión expirada: server + cliente (M, 4-6 h) — corrige M2

- `lib/auth.ts` (`refreshAccess`): en fallo 401/403 del refresh → limpiar `accessToken`/`refreshToken`/`accessTokenExpires` + `token.error = 'RefreshAccessTokenError'`; en error de red/5xx conservar tokens (blip transitorio). En callback `session`: `session.accessToken = token.error ? undefined : token.accessToken` — nunca entregar al browser un token vencido/irrenovable.
- Nuevo `lib/auth/session-expiry.ts`: `isSessionExpiredError(err)` (`ApiError` 401) + `handleSessionExpired()` idempotente (flag de módulo, no-op en `/login|/register`, `callbackUrl` validado con `isSafeInternalPath`, `signOut({redirect:false})` + `location.assign('/login?error=SessionExpired&callbackUrl=…')`).
- `app/providers.tsx`: `QueryClient` con `QueryCache`/`MutationCache` `onError` → `handleSessionExpired()` (cubre TODO el tráfico React Query sin tocar los 43 componentes) + componente interno `SessionExpiryWatcher` (`useSession` + efecto sobre `session.error` — necesario porque con el token en `undefined` las queries gateadas por `enabled` se apagan sin emitir 401).
- `use-api-mutation.ts` / `use-token-action.tsx`: suprimir toast si `isSessionExpiredError` (evita toast + redirect duplicados).
- `app/(auth)/login/page.tsx`: banner "Tu sesión expiró" con `searchParams.error === 'SessionExpired'`.
- Verificación manual: bajar `JWT_ACCESS_TTL=60`/`JWT_REFRESH_TTL=90` en el API, navegar/mutar en `/panel` → una sola redirección a login, sin loop, sin toasts duplicados.

#### P0.3 Headers de seguridad + CSP Report-Only (M, 3-4 h) — corrige A1

- `next.config.ts` → `headers()`. Enforce desde el día 1 (riesgo nulo): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva, `HSTS` solo `!isDev`.
- CSP en **`Content-Security-Policy-Report-Only`** (fase 1), construida desde env (`apiOrigin`, `storageOrigin`):

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self';
script-src 'self' 'unsafe-inline' https://maps.googleapis.com [dev: +'unsafe-eval'];
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: ${storageOrigin};
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' ${apiOrigin} ${storageOrigin} https://maps.googleapis.com https://*.amazonaws.com [dev: +ws: wss:];
worker-src 'self' blob:; [prod: upgrade-insecure-requests]
```

Justificaciones verificadas: Maps es JS API (no iframe) y requiere fuentes Roboto de Google; `blob:` para previews de dropzone, `data:` para QR (`ticket-qr.tsx`); `connect-src` debe incluir el host presignado de S3 (PUT XHR directo desde el browser); `img-src https:` coherente con `remotePatterns` vigente; `'unsafe-inline'` en scripts es obligatorio con CSP estática en App Router (nonce por-request queda en backlog P2).
- Nuevo `app/api/csp-report/route.ts`: POST → `logger.warn`, 204 (sin esto las violaciones solo se ven en consola del browser).
- Verificación: `curl -I` + recorrido funcional con consola abierta (home, local con mapa, galería + upload, checkout, QR, Google login) → cero violaciones.

#### P0.4 Drag-and-drop en flujos de creación (M-L, ~1 día) — corrige A3

Bloque compartido (prerequisito, reutilizado por P1.3 y P2.1):

- Nuevo `lib/hooks/use-staged-upload.ts` — hook `useStagedUpload(scope)` que encapsula el patrón hoy inline en `edit-event-dialog.tsx:241-263`: estado `{stagedKey, previewUrl, progress, status, file}`, `accept(file)` (objectURL + `uploadToStaging`), `cancel()`/`retry()`/`reset()`, revocación de objectURL en unmount.
- Nuevo `components/shared/staged-image-field.tsx` — `StagedImageField {scope, currentUrl?, onStagedKeyChange, disabled?}`: preview (blob crudo / actual con `StorageImage`) + progreso + `MediaDropzone maxFiles={1}` (se reutiliza tal cual).

Crear evento con flyer (requiere contrato + API):

- `packages/contracts/src/events/event.ts`: añadir `flyerKey: z.string().max(512).optional()` a `createEventSchema` (mismo shape que ya existe en `updateEventSchema`). `flyerUrl` se mantiene por retrocompatibilidad.
- API: extraer de `update-event.use-case.ts:83-124` un helper (`validateStagedImage` / `promoteStagedImage`: prefijo `tmp/` + HEAD size/mime + copy/delete). `create-event.use-case.ts`: inyectar `STORAGE_PORT`; con `flyerKey` → validar staging ANTES de insertar, crear, promover a `events/{id}/`, `setFlyer(finalKey)`. Refactor de update para consumir el helper. Tests: casos flyerKey válida / no-staging / inexistente en `create-event.use-case.spec.ts`.
- `create-event-dialog.tsx`: quitar `flyerUrl` fantasma; añadir `StagedImageField scope="event"`; enviar `flyerKey`; bloquear submit mientras sube.

Crear local con portada (solo web, cero cambios de API):

- `create-local-dialog.tsx`: eliminar el `FormField` de `mainImageUrl` (:196-210); añadir `StagedImageField scope="local"`; tras el create exitoso, `confirmLocalImage(local.id, {key, isMain: true})` (endpoint existente que promueve, crea fila de galería y vuelca `main_image_url`). Si el confirm falla: toast de advertencia ("Local creado; sube la imagen desde su galería") y cerrar — el local es válido sin portada. Invalidar `queryKeys.localImages(local.id)`.
- Alternativa descartada: `mainImageKey` en `createLocalSchema` duplicaría la promoción sin crear fila de galería.

### FASE P1 — Importante (~1.5 días + ventana de observación CSP)

| Ítem | Corrige | Detalle | Esfuerzo |
|---|---|---|---|
| P1.1 Endurecer `isSafeInternalPath` | M4 | `lib/utils/paths.ts`: longitud 1..2048; empieza por `/`; rechazar backslash y control-chars en cualquier posición; rechazar segundo char peligroso (`//`, `/%2F`, `/%5C`); red de seguridad canónica `new URL(path, base).origin === base`. No rechazar `%2F` en query (caso legítimo de `post-login`). Documentar cada regla con su vector. | S (1 h) |
| P1.2 Timeout en `apiFetch` | B1 | `client.ts`: `timeoutMs` (default 15 s) con `AbortSignal.timeout` + `AbortSignal.any` si el caller pasa signal (no hay streaming en la app — verificado). `error-messages.ts`: mensaje localizado para `TimeoutError`/`AbortError`. Uploads no afectados (van por XHR presignado). | S (1-2 h) |
| P1.3 Cancel/retry + thumbnails + width/height | M8 | `uploads.ts`: `signal?: AbortSignal` en `putToSignedUrl` (→ `xhr.abort()`) y `uploadToStaging`. Nuevo `lib/utils/image.ts` `readImageSize(file)` (createImageBitmap, nunca lanza). `local-images-manager.tsx`: ítem con `{previewUrl, controller}`, thumbnail + botón cancelar + botón reintentar (extraer `uploadOne(item)`); enviar `width/height` en el confirm; abort ≠ error (sin toast). Heredado por `useStagedUpload`. Opcional: `packages/ui/progress.tsx` para las 2 barras duplicadas. | M (3-4 h) |
| P1.4 `AlertDialog` + confirmaciones | M6, B5 | `packages/ui`: dep `@radix-ui/react-alert-dialog` + `alert-dialog.tsx` (port shadcn, estilo de `dialog.tsx`) + export. Nuevo `components/shared/confirm-dialog.tsx` (wrapper controlado). Aplicar en eliminar imagen (`local-images-manager`) y desasignar evento (`assign-event-dialog`) — un solo dialog controlado por manager, no uno por celda. | M (2-3 h) |
| P1.5 `StorageImage` en galería admin | M5 | `local-images-manager.tsx:198`: `<img>` → `<StorageImage src={image.url} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover">`; verificar en dev (LocalStack http) que no aparece el 400 de `/_next/image`. | S (30 min) |
| P1.6 CSP a enforce | A1 | Tras 3-7 días sin violaciones en `/api/csp-report`: renombrar a `Content-Security-Policy`, incorporar el host presignado real de S3 en prod. Mantener report-uri. | S (30 min + observación) |

### FASE P2 — Refactors y polish (~2 días)

| Ítem | Corrige | Detalle |
|---|---|---|
| P2.1 Migrar `edit-event-dialog` a RHF+Zod | M7 | Nuevo `lib/utils/datetime.ts` (`isoToLocalInput`/`localInputToIso`; eliminar duplicado `localDateTimeToIso` de `create-event-dialog.tsx:34-38`); `tagKey` → `lib/utils/format.ts`; `ChipSelect` → `components/shared/chip-select.tsx` (desacoplar de `ZoneResponse`). Reescribir con `zodResolver` sobre `updateEventSchema`, errores inline (`Form*` + `useApiMutation`), flyer vía `StagedImageField`. De ~525 a ~300 líneas. Verificar ida/vuelta de fechas con zona horaria. |
| P2.2 Paginación consumer | B2 | `eventListQuerySchema`: `limit`/`offset` opcionales (retrocompatible). API: LIMIT/OFFSET en repo + test. Web: `searchParams.page`, pedir `limit+1` para inferir siguiente página, prev/next como `<Link>` (compatible ISR). Replicar a `/locals`. |
| P2.3 Onboarding loading/error | B4 | `app/onboarding/error.tsx` (`makeErrorBoundary`, patrón existente) + `loading.tsx` (skeleton, patrón de `events/loading.tsx`). |
| P2.4 Refactor `checkout-client` | B3 | Extraer `use-checkout-form.ts` (schema/fieldArray/freeOffer/submit); componente queda como orquestador visual. Sin cambio de comportamiento. |
| P2.5 ADR exposición accessToken | M1 | `docs/adr/0006-access-token-en-cliente-vs-proxy-bff.md`: aceptar riesgo con mitigaciones (refresh nunca en browser, TTL 15 min, CSP enforce, sin scripts de terceros salvo Maps, sin `dangerouslySetInnerHTML`); BFF descartado (reescribir 43 componentes + hop de latencia + complicar presign). Condiciones de re-evaluación: scripts de terceros, TTL mayor, XSS real. |

### Backlog (documentado, no planificado)

- CSP estricta con nonce por-request vía `proxy.ts` (elimina `'unsafe-inline'` de scripts) — la mitigación XSS "real" que complementa P2.5.
- Cropper/aspect ratio en `StagedImageField` (`react-easy-crop`; requiere decisión de producto sobre ratios).
- Test runner (vitest) en `apps/web` con specs para `isSafeInternalPath` (tabla de vectores) y `env.schema.ts`.
- Adopción amplia de `useTokenAction` / hook `useAuthToken()` (B6); unificar estrategia de revalidación y aprovechar `revalidateTag` (B7).
- Restricción por HTTP-referrer de la key de Maps en GCP (B8, operativo).
- `aria-label` en input del dropzone; `alt` significativo en miniaturas de contenido (B9).

### Secuenciación y dependencias

1. P0.1–P0.3 independientes entre sí; P0.1 primero (más barato, mayor impacto).
2. P0.4: bloque compartido (hook+field) → contrato (`pnpm --filter @urnight/contracts build`) → API → web.
3. P1.4 (packages/ui) requiere `pnpm install` tras añadir la dep radix.
4. P2.1 depende del bloque compartido de P0.4. P1.6 depende de la ventana de observación de P0.3.

### Flujos manuales mínimos de aceptación

1. Crear local arrastrando portada → aparece en listado y en galería como "Portada", reordenable/eliminable.
2. Crear evento arrastrando flyer → detalle muestra el flyer sin pasar por "Editar".
3. Galería: subir 3 archivos con thumbnails, cancelar el 2.º (no llega al API), forzar fallo (parar LocalStack) → reintentar funciona; `local_image.width/height` no nulos.
4. Eliminar imagen / desasignar evento → piden confirmación; Escape no muta.
5. Sesión: con TTLs cortos en el API, navegar/mutar → una redirección a `/login?error=SessionExpired`, sin loop.
6. `curl -I` muestra todos los headers; recorrido completo sin violaciones CSP; open-redirect: `//evil.com`, `/\evil.com`, `/%2F%2Fevil.com` caen a `/`, el `callbackUrl` legítimo navega.
7. Apagar el API → toast de timeout a los ~15 s, sin promesas colgadas.
