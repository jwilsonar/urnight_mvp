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

Este lote entrega el mapeo AS-IS, este ADR y el esquema/migración de
`local_verification_document`. Quedan para el siguiente lote:

- contratos y endpoints de presign/confirmación documental;
- bandeja y revisión de superadmin con auditoría;
- derivación en dominio y eliminación de `is_verified` como fuente mutable;
- job de avisos/degradación y su prueba de integración;
- panel admin, copy ES/EN y e2e de subida/revisión.

La columna `local_verification.reviewed_at` y la migración `0013` se conservan
sin duplicarlas.

## Consecuencias

- Durante la transición, `local.is_verified` sigue siendo compatibilidad
  denormalizada; no debe ampliarse con escrituras manuales nuevas.
- Los documentos históricos permiten auditoría y renovación sin perder la
  evidencia anterior.
- La expiración automática requiere definir ventanas de aviso y destinatarios
  reales antes de activar notificaciones externas.
