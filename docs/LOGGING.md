# UrNight — Estrategia de Logging

> Fuente de verdad de la observabilidad operativa del MVP. Deriva de `PROJECT_SPECS.md`
> §6 (Observabilidad: `pino` + `AUDIT_LOG` + `ANALYTICS_EVENT`) y §2.3 (naming).
> Toda desviación se registra como ADR (§8 del spec).

## 1. Pilares

| Pilar | Mecanismo | Estado |
|---|---|---|
| **Operacional** (qué pasó, latencia, errores) | `pino` JSON estructurado | ✅ este documento |
| **Seguridad / trazabilidad** | `AUDIT_LOG` (vía `AuditInterceptor` → módulo Ops) | semilla en log `audit.action` |
| **Producto / métricas** | `ANALYTICS_EVENT` | módulo Ops |

Este documento cubre el **pilar operacional** (logs) y cómo se integra con los otros dos.

## 2. Niveles

Un único criterio en todo el monorepo (API, Worker, Web, Mobile, Validator):

| Nivel | Cuándo | Ejemplos |
|---|---|---|
| `fatal` | El proceso no puede continuar | fallo al conectar DB/Redis en arranque |
| `error` | Fallo **inesperado** (5xx, infra caída, excepción no controlada) | `http.error.unhandled`, `eventbus.handler_failed`, `storage.head.error` |
| `warn` | Fallo **esperado** de negocio/seguridad o degradación tolerada | `identity.login.invalid_credentials`, `auth.token.invalid`, `ratelimit.exceeded`, `*.fail_open` |
| `info` | **Hito de negocio** auditable (hecho de dominio relevante) | `ticketing.order.paid`, `identity.login.success`, `qr.validated`, `verification.approved` |
| `debug` | Entrada/salida de caso de uso, llamadas a infra | `ticketing.checkout.started`, `storage.presign.upload`, `lock.acquired` |
| `trace` | Detalle fino (raro) | iteraciones internas, dumps |

> **Regla 4xx vs 5xx:** un `DomainError` (regla de negocio, 4xx) es **esperado** → `warn`/`debug`,
> nunca `error`. `error` se reserva para lo que un humano debe investigar.

Nivel efectivo por entorno (override con `LOG_LEVEL`): `production=info`, `development=debug`, `test=silent`.

## 3. Formato: evento estructurado, no string interpolado

**Siempre** `log.<nivel>(fields, 'evento.key')`. El mensaje es una **clave de evento estable**
en `dot.case` namespaced por módulo; los datos van en el objeto, nunca interpolados en el string.

```ts
// ✅ correcto — filtrable por máquina, sin PII suelta
this.log.info({ orderId, userId, total, currency, tickets }, 'ticketing.order.paid');

// ❌ incorrecto — no estructurado, IDs en el mensaje
this.logger.log(`Orden ${orderId} pagada por ${userId}: ${total}`);
```

### Convención de claves de evento

`<modulo>.<entidad|flujo>.<resultado>` — minúsculas, `dot.case`. El resultado describe el hecho:
`started` · `success` · `created` · `paid` · `issued` · `validated` · `approved` · `rejected` ·
`failed` · `invalid` · `not_found` · `denied` · `exceeded`.

Ejemplos: `identity.login.success`, `identity.register.created`, `companies.verification.approved`,
`events.event.published`, `ticketing.checkout.started`, `ticketing.qr.validated`,
`promoters.sale.attributed`, `trust.review.created`, `ops.support_ticket.created`.

### Campos canónicos (camelCase, §2.3)

Reutiliza estos nombres para que los logs crucen módulos de forma coherente:

`userId` · `orderId` · `eventId` · `ticketId` · `ticketTypeId` · `localId` · `companyId` ·
`promoterId` · `reqId` · `action` · `status` · `code` · `reason` · `err` · `ms`.

## 4. PII y secretos — redacción obligatoria (§6)

**Nunca** emitir: contraseñas/hashes, tokens (access/refresh/id/handoff), `qrCode`, números de
documento, cookies ni cabecera `Authorization`. La redacción está centralizada en
`REDACT_PATHS` (`apps/api/src/shared/logging/logger.ts`) y cubre nivel raíz y un nivel anidado.

Reglas de oro:
- Identifica al actor por **`userId` (UUID)**, no por email ni documento.
- Si añades un campo sensible nuevo, **agrégalo a `REDACT_PATHS`** en el mismo PR.
- A nivel `info+` no se loguea email completo; a `debug` es tolerable solo si aporta.

## 5. Uso por aplicación

### 5.1 API (NestJS) y Worker — `createLogger`

Una sola instancia `pino` raíz (`shared/logging/logger.ts`) alimenta el logger HTTP de
`nestjs-pino` (vía `logging.config.ts`, con `req.id` + `userId`) **y** los loggers de dominio.

Los loggers de dominio se crean **sin DI** para no romper `new UseCase(...)` en tests:

```ts
import { createLogger } from '../../../../shared/logging/logger';

@Injectable()
export class CheckoutUseCase {
  private readonly log = createLogger(CheckoutUseCase.name);

  async execute(input: ...): Promise<...> {
    this.log.debug({ userId, eventId, items: dto.items.length }, 'ticketing.checkout.started');
    ...
    this.log.info({ orderId, userId, total, currency, tickets }, 'ticketing.order.paid');
  }
}
```

**Qué loguear en un caso de uso:**
- `debug` al entrar (`<modulo>.<flujo>.started`) con los IDs de entrada.
- `info` en el **hito** (creación/transición de estado/aprobación) con los IDs resultantes.
- `warn` antes de lanzar un `DomainError` relevante (denegación, conflicto, no encontrado) —
  **no** hace falta loguear cada validación trivial; el `ProblemJsonFilter` ya registra todo 4xx/5xx.
- Casos de uso de **solo lectura** (list/get): normalmente nada, o `debug` si ayuda.

**Edge / infra ya cubiertos** (no duplicar): HTTP req/res (pino-http), errores no controlados
(`ProblemJsonFilter`), auth (`AuthGuard`), rate-limit, event bus, outbox, locks, storage, pagos.

> No inyectes `PinoLogger` por constructor en casos de uso/adapters: rompe la instanciación
> directa en los specs. Usa siempre `createLogger`.

### 5.2 Web (Next.js) — `lib/logger.ts`

Logger isomórfico (server = JSON; cliente = consola), misma firma `(fields, msg)`:

```ts
import { logger } from '@/lib/logger';
logger.warn({ status: err.status, code: err.code, path }, 'web.api.error');
```

Puntos cubiertos: `apiFetch` (errores de red/HTTP), Server Actions de auth, callbacks de NextAuth
(refresh/exchange), error boundaries. **Nunca** loguear tokens (el handoff/sesión es server-only).

### 5.3 Mobile / Validator (Expo RN) — `lib/logger.ts`

Logger ligero basado en consola, con tags y niveles (sin `pino`, incompatible con RN). Cubre:
api-client, sincronización offline (`offline-cache`), escaneo de QR (logueando solo metadatos del
check-in, **nunca** el contenido del QR).

## 6. Correlación

- `genReqId` propaga/crea `x-request-id` y lo emite en la respuesta. El log HTTP de `pino-http`
  lleva `req.id`; los componentes edge lo añaden como `reqId`.
- Los logs de dominio se correlacionan por **IDs de negocio** (`orderId`, `userId`, …). Para
  enlazar un hito con su request HTTP, cruza por `userId` + ventana temporal o pasa `reqId`.

## 7. Checklist para añadir logs

- [ ] `log.<nivel>(fields, 'modulo.entidad.resultado')` — objeto primero, clave estable después.
- [ ] Nivel correcto (4xx→`warn`/`debug`, 5xx/inesperado→`error`, hito→`info`).
- [ ] Sin PII/secretos; si hay campo nuevo sensible, va a `REDACT_PATHS`.
- [ ] `userId` por UUID; campos canónicos reutilizados.
- [ ] No duplicar lo que ya cubre el edge (HTTP, auth, errores).
- [ ] `createLogger` en API/Worker (nunca `PinoLogger` por constructor en use-cases).
