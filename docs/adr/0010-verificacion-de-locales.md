# ADR 0010 — Ciclo documental de verificación de locales

**Estado:** Aceptado por fases · **Fecha:** 2026-07-30

## Flujo actual comprobado (AS-IS)

1. `/onboarding` completa preferencias del consumidor y su marca
   `onboardingCompleted`; no afilia empresas ni locales.
2. La afiliación de un local empieza en `/afiliar`. El formulario público envía
   `POST /affiliation-requests`.
3. Un `super_admin` revisa la solicitud por ID. Al aprobar,
   `ReviewAffiliationUseCase` crea `company` y `local` en una transacción y los
   deja en borrador. La aprobación no crea usuario ni asigna `admin_local`.
4. Un admin con acceso puede completar el local, subir imágenes con presigned
   URL y publicar mediante `POST /locals/{id}/publish`. El catálogo solo muestra
   locales `active`.
5. La verificación existente es una solicitud única `local_verification` con
   `license_reference`, `document_url`, `valid_until` y estados `pending`,
   `approved`, `observed` o `expired`.
6. El superadmin revisa por ID. El caso de uso copia el resultado a
   `local.is_verified`; no existe bandeja de pendientes, documentos múltiples,
   renovación, aviso previo ni job de vencimiento.
7. La ficha pública ya expone estado y `reviewed_at`. La tarjeta pública no
   muestra el badge positivo. El panel admin todavía presenta el flujo simple
   de solicitar verificación.

## Decisión objetivo

- Cada solicitud de verificación agrupará documentos en
  `local_verification_document`.
- Se persiste `storage_key`, nunca una URL pública. Cada documento registra
  tipo, emisión, vencimiento, estado de revisión, revisor, fecha y notas.
- Para el primer catálogo regulatorio serán requeridos
  `municipal_license` e `itse_certificate`; `health_certificate` podrá marcarse
  requerido según el tipo de local. `other` no concede verificación por sí solo.
- El estado público será derivado: `verified` únicamente cuando todos los
  documentos requeridos tengan una versión `approved` y no vencida;
  `unverified` si falta uno, fue rechazado o venció.
- La renovación crea una nueva solicitud/documentos; no sobrescribe evidencia
  histórica aprobada.
- El worker enviará aviso previo por la cola de notificaciones existente y
  degradará al vencer. Email y push seguirán detrás de sus puertos actuales; no
  se introduce un proveedor nuevo.

## Entrega por fases

La fase 1 entregó el mapeo AS-IS y la tabla
`local_verification_document`. La fase 2 completa:

- contratos compartidos y endpoints de presign/confirmación documental;
- listado tenant-scoped para `admin_local` y bandeja pendiente para
  `super_admin`;
- revisión de cada documento, con motivo obligatorio al rechazar y traza del
  `AuditInterceptor`;
- derivación única en dominio a partir de las versiones aprobadas vigentes de
  cada tipo requerido;
- job BullMQ repetible que avisa antes del vencimiento y degrada solo cuando no
  hay una versión aprobada vigente;
- paneles admin/superadmin, aviso público no alarmista, copy ES/EN y datos de
  demo.

La tabla documental propia se mantiene porque una verificación agrupa varias
evidencias y cada renovación conserva versiones históricas. Ampliar columnas en
`local_verification` habría perdido esa cardinalidad e historial.

Los tipos requeridos y la ventana de aviso no están quemados en casos de uso:
se leen de `platform_setting` mediante las claves
`verification_required_document_types` y
`verification_expiry_warning_days`. Si faltan o son inválidas, el fallback
conservador exige licencia municipal + ITSE y avisa con 30 días.

La cola de notificaciones ya queda conectada mediante
`send-local-document-expiry-warning`. Email sigue detrás del `EmailPort` de la
ADR 0004; en el piloto su adaptador es de log. Activar entrega externa requiere
conectar el proveedor real existente, no crear otro dentro de Companies.

La columna `local_verification.reviewed_at` y la migración `0013` se conservan
sin duplicarlas. `local.is_verified` queda como proyección denormalizada para
compatibilidad; la ficha pública y las mutaciones documentales calculan el
estado desde los documentos.

## Consecuencias

- Durante la transición, `local.is_verified` sigue siendo compatibilidad
  denormalizada; no debe ampliarse con escrituras manuales nuevas.
- Los documentos históricos permiten auditoría y renovación sin perder la
  evidencia anterior.
- La expiración automática requiere definir ventanas de aviso y destinatarios
  reales antes de activar notificaciones externas.
