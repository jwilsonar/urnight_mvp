# ADR 0004 — Notificaciones del Worker: storage real, email/push stub en el piloto

**Estado:** Aceptado · **Fecha:** 2026-07-02

## Contexto

`PROJECT_SPECS.md` §1.5 marca **Email** y **Push (FCM/APNs)** como "✅ Incluido"
en el MVP (solo la pasarela de pagos es mock declarado). La auditoría
`docs/AUDIT_2026-07-02.md` (A5 / B2) detectó que el worker
(`apps/worker`) resolvía Email, Push **y** Storage con adapters que solo
loguean (`LogEmailAdapter`, `LogPushAdapter`, `LogStorageAdapter`): el PDF de
entradas nunca se subía a S3, `ticket.pdf_url` quedaba siempre `null` y la tabla
`notification` solo la escribía el seed.

Conectar proveedores reales de Email (SES/Resend) y Push (FCM/APNs) exige
credenciales, dominios verificados (SPF/DKIM) y apps móviles registradas —
fuera del alcance de un piloto local. En cambio el Storage **sí** tiene una
implementación real ya operativa en la API (`S3StorageAdapter` sobre
LocalStack/S3), reutilizable sin credenciales externas nuevas.

## Decisión

1. **Storage = real.** El worker sube el PDF de entradas a **S3/LocalStack de
   verdad**. Como el adapter real de la API vive en `apps/api` y no debe
   importarse cross-app, se crea uno **equivalente** en el worker
   (`apps/worker/src/storage/s3-storage.adapter.ts`), acotado a `putObject`, que
   usa **las mismas variables de entorno** (`AWS_REGION`, `AWS_ENDPOINT`,
   `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`).
   La key resultante se persiste en `ticket.pdf_url` (se guarda la key, no la
   URL — §storage). `LogStorageAdapter` queda como código muerto de referencia.

2. **Email y Push = stub en el piloto.** Se mantienen `LogEmailAdapter` y
   `LogPushAdapter` (registran el envío). La **interfaz ya está lista**
   (`EmailPort` / `PushPort`, anti-corruption §3.2): conectar el proveedor real
   es un cambio de binding en `app.module.ts`, sin tocar el processor. Para que
   el efecto sea observable pese al stub, el worker **persiste filas
   `NOTIFICATION`** (`status='sent'`) en cada envío, de modo que
   `GET /notifications/me` sirve datos reales y no solo el seed.

3. **Idempotencia de ejecución.** Ante un reproceso (retry BullMQ), el handler
   de entradas usa `ticket.pdf_url` como marca de "ya procesado": si todas las
   entradas de la orden ya la tienen, no regenera el PDF ni reinserta
   notificaciones. `pdf_url` se fija como última escritura del handler.

## Consecuencias

- El PDF de entradas es descargable de verdad en el piloto (S3/LocalStack) y
  `ticket.pdf_url` deja de ser `null`.
- Los correos/push **no llegan** al usuario final en el piloto: quedan como log
  + fila `NOTIFICATION`. Riesgo asumido y acotado a este entorno.
- Deuda pendiente para producción: implementar `SesEmailAdapter` /
  `FcmPushAdapter` y cambiar el binding; añadir sus credenciales a
  `.env.example`. No requiere cambios en el processor ni en los puertos.
- Divergencia con SPECS §1.5 (Email/Push "Incluido") documentada aquí según
  exige `CLAUDE.md` (toda desviación → ADR).
