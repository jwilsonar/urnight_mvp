# Estrategia de carga drag-and-drop + S3

> Referencia técnica para subida y gestión de archivos/imágenes en UrNight.
> Deriva de `PROJECT_SPECS.md` §1.4 (Object Storage), §5 (Storage = S3 + URLs firmadas)
> y del DER (`local_image`, `event_image`, `user.avatar_url`, etc.).
> Elaboración de una decisión ya tomada (§5) — **no requiere ADR**.

**Estado:** aprobado · **Fecha:** 2026-06-21

---

## 1. Principio

**El cliente sube y descarga directo a S3. La API solo firma URLs.** El binario
nunca pasa por NestJS: el checkout y el resto del API no se bloquean, no hay
límite de body, y escala sin coste de cómputo. El drag-and-drop es solo UX
encima de ese flujo de URLs firmadas.

## 2. Flujo (presigned PUT, 3 pasos)

```
[Front] usuario suelta archivo
   │ 1. POST /api/v1/uploads/presign  { scope, contentType, sizeBytes }
   ▼
[API]  auth + valida mime ∈ permitidos + size ≤ máx → firma PUT a tmp/{uuid}.{ext}
   │    (expira 5 min, ContentType bindeado)  →  { uploadUrl, key }
   ▼
[Front] 2. PUT uploadUrl  (binario directo a S3/LocalStack, con onUploadProgress)
   │
   ▼
[Front] 3. POST /api/v1/locals/:id/images  { key }   (confirm, en módulo dueño)
   │
   ▼
[API]  HEAD S3 (verifica size/mime reales) → copia tmp→final → persiste fila → URL final
```

El `presign` **no** puede forzar el tamaño en un PUT firmado, así que el
**confirm hace HEAD** al objeto y rechaza (+borra) si excede el límite o el mime
miente. El cliente nunca es fuente de verdad del tamaño.

### Por qué staging `tmp/`

- El presign firma a `tmp/{uuid}.{ext}` — **no ligado a ningún tenant todavía**.
- La autorización real (multi-tenant) ocurre en el **confirm**, que vive en el
  módulo dueño (locals/events) y tiene acceso al repo y al `actorCompanyId`.
  Esto respeta la Regla de Dependencias (§2.2): `uploads` no importa repos de
  otros módulos.
- Los huérfanos (subidos pero nunca confirmados) se autolimpian con una
  **lifecycle rule**: objetos bajo `tmp/` expiran a las 24 h. Sin job de barrido.

## 3. Mapa de recursos → S3

| Recurso | Tabla / columna | Prefijo final | Mult. | Scope RBAC | Visibilidad |
|---|---|---|---|---|---|
| Imágenes de local | `local_image` (`is_main`, `sort_order`, `width/height/size_bytes`) | `locals/{localId}/` | N | admin_local del company dueño | pública (catálogo) |
| Portada de local | `local.main_image_url` | `locals/{localId}/` | 1 | idem | pública |
| Imágenes de evento | `event_image` (`is_flyer`, `sort_order`) | `events/{eventId}/` | N | admin_local/promoter del local | pública |
| Flyer de evento | `event.flyer_url` | `events/{eventId}/` | 1 | idem | pública |
| Avatar | `user.avatar_url` | `users/{userId}/` | 1 | dueño | pública |
| Doc. verificación | `local_verification.document_url` | `verifications/{localId}/` | N | admin_local + super_admin | **privada** (signed GET) |
| PDF de ticket | `ticket.pdf_url` | `tickets/{ticketId}.pdf` | 1 | dueño de la orden | **privada** (signed GET) — lo sube el Worker |

## 4. Naming de keys

- Staging: `tmp/{uuid}.{ext}`
- Final: `{prefijo}{uuid}.{ext}` (ej. `locals/{localId}/{uuid}.jpg`)
- UUID aleatorio (no enumerable, §5 IDs). Extensión derivada del mime validado.

## 5. Público vs privado

- **Catálogo** (`locals/`, `events/`): lectura pública → servido por CDN
  (CloudFront §1.4) o `public-read`. URL final guardada directa en la columna.
- **Privado** (`verifications/`, `tickets/`): bucket privado → `getDownloadUrl`
  firmado por request, expira corto.

## 6. Seguridad / invariantes

- **RBAC scope multi-tenant** (§invariantes): el confirm rechaza si el actor no
  posee el target. `admin_local` solo confirma imágenes en locals de su company.
- URL firmada **expira 5 min**, **ContentType bindeado** (solo acepta ese mime).
- **Size real** verificado server-side (HEAD en confirm).
- Mime permitido y tamaño máximo definidos **una sola vez** en
  `packages/contracts` y reusados en cliente (validación dropzone) y servidor
  (presign + confirm). Cero drift (§5 Zod compartido).
- El Worker sube PDFs con `putObject` (server-side), nunca por drag-drop.

## 7. Contracts compartidos

`packages/contracts/src/uploads/`:

```ts
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const presignRequestSchema = z.object({
  scope: z.enum(['local', 'event', 'avatar']),
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});
export const presignResponseSchema = z.object({ uploadUrl: z.string().url(), key: z.string() });
```

## 8. Componentes

### Backend
- `StoragePort`: `getUploadUrl`, `getDownloadUrl`, `putObject`, `deleteObject`
  (hechos) + **`headObject`**, **`copyObject`** (nuevos).
- Módulo `uploads`: `PresignUploadUseCase` + `POST /uploads/presign`.
- Confirm en módulos dueños: `POST/PATCH/DELETE /locals/:id/images`,
  idem `/events/:id/images`, avatar en identity.

### Frontend
- Deps: `react-dropzone` (drag-and-drop), `@dnd-kit/*` (reordenar galería).
- Hook `useS3Upload`: presign → PUT con progreso → confirm. Valida con el Zod
  compartido antes de presign.
- `<MediaDropzone>` reusable: `{ scope, targetId, maxFiles, maxSizeMB, accept }`.
  Preview, progreso por archivo, retry, error inline. Sobre el patrón
  `use-api-mutation` (toast sonner + invalidación de query-keys).
- `<MediaGallery>`: grid, drag-reorder → PATCH `sort_order`, marcar principal
  (`is_main`/`is_flyer`), borrar. Optimistic update + rollback.

## 9. Fases de implementación

1. Contracts `uploads/` + `StoragePort.headObject/copyObject` + lifecycle `tmp/`.
2. `PresignUploadUseCase` + `POST /uploads/presign`.
3. Confirm endpoints en `locals` (CRUD `local_image`: confirm, reorder, main, delete).
4. Front: `useS3Upload` + `<MediaDropzone>` + `lib/api/uploads.ts`.
5. Front: `<MediaGallery>` + cableado en panel admin de locals.
6. Replicar a `events` y `avatar` (mismo molde).

## 10. Decisiones

| Decisión | Elección | Motivo |
|---|---|---|
| Subida | Presigned PUT (no POST-policy) | Más simple; size verificado en confirm vía HEAD. |
| Huérfanos | Staging `tmp/` + lifecycle 24 h | Autolimpieza, sin job de barrido. |
| Visibilidad catálogo | `public-read` en `locals/`+`events/` | Sirve directo vía CDN; resto privado firmado. |
| Reorder UI | `@dnd-kit/sortable` | Accesible, headless, encaja con Tailwind/shadcn. |
