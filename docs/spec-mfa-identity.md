# Spec de implementación — MFA (TOTP) en Identity

> **Estado: propuesta técnica, pendiente de revisión de Wilson.** Nada de esto
> está implementado.
>
> La **decisión** ya está tomada en [`docs/adr/0008-roadmap-mfa.md`](adr/0008-roadmap-mfa.md):
> TOTP como primer factor adicional, obligatorio para `super_admin` y
> `admin_local`. Este documento no la re-discute: aporta el **contrato** que
> falta para poder implementarla — tablas, puertos, casos de uso, endpoints y
> errores. Los nombres están elegidos para encajar con lo que ya existe en
> `apps/api/src/modules/identity/`.
>
> El ADR 0008 dice literalmente que no autoriza una implementación parcial ni
> guardar secretos en el navegador. Por eso aquí no hay frontend hasta que el
> API emita y valide desafíos reales.

## 1. Estado verificado del código (2026-08-04)

- `identity/domain/ports/` tiene `password-hasher.port.ts`, `refresh-token-store.port.ts`, `google-verifier.port.ts` y `legal.repository.ts`. **No hay puerto de MFA.**
- `login.use-case.ts` termina en `return this.issuer.issueFor(user)` — emite el par de tokens sin ningún desafío intermedio.
- `packages/db/src/schema/identity.ts` tiene `user`, `role`, `user_role`, `user_preference`, `legal_document`, `legal_acceptance`, `user_favorite`. **Ninguna tabla de MFA.**
- La ruta web `/2fa` es maqueta: seis campos numéricos sin llamada al API.

## 2. Tablas nuevas

Convenciones §2.3: PK uuid vía `helpers.id()`, auditoría vía `helpers.timestamps()`, `varchar` + `CHECK` en discriminadores, nombres snake_case singular, índices `idx_<tabla>_<col>`.

```
user_mfa_factor                     -- un factor por usuario y tipo
  id                uuid PK
  user_id           uuid FK user ON DELETE CASCADE
  type              varchar(10)  CHECK (type in ('totp'))      -- email_otp/sms más adelante
  secret_encrypted  varchar(255)                               -- cifrado en reposo, nunca se devuelve
  status            varchar(10)  CHECK (status in ('pending','active','revoked'))
  confirmed_at      timestamptz NULL
  last_used_at      timestamptz NULL
  created_at, updated_at
  UNIQUE (user_id, type) WHERE status <> 'revoked'             -- índice parcial
  idx_user_mfa_factor_user

user_recovery_code                  -- diez por enrolamiento, un solo uso
  id            uuid PK
  user_id       uuid FK user ON DELETE CASCADE
  code_hash     varchar(100)                                   -- mismo hasher que las contraseñas
  used_at       timestamptz NULL
  created_at
  idx_user_recovery_code_user
```

**El secreto TOTP no es un hash: es reversible por necesidad** (hay que recalcular el código en cada verificación). Va cifrado con una clave de aplicación, no con el hasher de contraseñas. Esa clave debe vivir en el entorno, nunca en el repo, y su rotación es una decisión aparte que conviene anotar cuando se implemente.

## 3. Dominio

Puerto nuevo, `identity/domain/ports/mfa.repository.ts`, exportando la interfaz y su token `Symbol` (`MFA_REPOSITORY`), igual que el resto del módulo. Segundo puerto, `totp.port.ts` con token `TOTP_PORT`, como capa anticorrupción sobre la librería de TOTP — el dominio no debe importarla.

```ts
interface TotpPort {
  generateSecret(): string;
  buildOtpAuthUri(secret: string, accountLabel: string): string;
  verify(secret: string, code: string): boolean;   // ventana ±1 paso de 30 s
}
```

Errores nuevos en `identity.errors.ts`, con sus códigos en `IDENTITY_ERROR_CODES`:

| Clase | Código | HTTP |
|---|---|---|
| `MfaAlreadyEnrolledError` | `identity/mfa-already-enrolled` | 409 |
| `MfaNotEnrolledError` | `identity/mfa-not-enrolled` | 409 |
| `InvalidMfaCodeError` | `identity/invalid-mfa-code` | 401 |
| `MfaChallengeExpiredError` | `identity/mfa-challenge-expired` | 401 |
| `MfaLockedError` | `identity/mfa-locked` | 429 |

Todos viajan como problem+json por el `ProblemJsonFilter` global, sin trato especial.

## 4. Casos de uso

Uno por archivo en `application/use-cases/`, siguiendo el nombrado existente:

- `start-mfa-enrollment.use-case.ts` — genera secreto, guarda el factor en `pending`, devuelve el URI `otpauth://` y el secreto **una sola vez**.
- `confirm-mfa-enrollment.use-case.ts` — verifica el primer código, pasa el factor a `active`, genera diez códigos de recuperación y los devuelve **una sola vez**.
- `verify-mfa-challenge.use-case.ts` — valida el código del desafío de login y recién ahí llama a `TokenIssuer.issueFor(user)`.
- `use-recovery-code.use-case.ts` — consume un código de recuperación, lo marca usado y emite sesión.
- `revoke-mfa.use-case.ts` — revoca el factor. Exige reautenticación reciente.
- `regenerate-recovery-codes.use-case.ts` — invalida los anteriores y emite diez nuevos.

## 5. Cambio en el login (lo delicado)

Hoy `login.use-case.ts` devuelve `AuthResult` siempre. Con MFA, cuando el usuario tiene un factor `active` **no** debe emitir tokens: devuelve un desafío.

```ts
type LoginOutcome =
  | { kind: 'session'; result: AuthResult }
  | { kind: 'mfa_challenge'; challengeId: string; expiresAt: string };
```

El `challengeId` es opaco, vive en Redis con TTL de 5 minutos y guarda el `userId` ya autenticado por contraseña. **No** es un token de sesión y no sirve para nada más. La misma bifurcación aplica a `google-login.use-case.ts`.

Esto cambia la forma de respuesta de `POST /auth/login`, así que **rompe el contrato actual**: hay que versionar o coordinar el despliegue con el frontend. Es la decisión que más conviene revisar antes de escribir código.

## 6. Endpoints

Sobre `auth.controller.ts` y un `mfa.controller.ts` nuevo bajo `interfaces/http/`:

| Método | Ruta | Guard | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/auth/mfa/verify` | `@Public()` | `{ challengeId, code }` | `AuthResult` |
| POST | `/auth/mfa/recovery` | `@Public()` | `{ challengeId, recoveryCode }` | `AuthResult` |
| POST | `/mfa/enroll` | autenticado | — | `{ otpauthUri, secret }` |
| POST | `/mfa/enroll/confirm` | autenticado | `{ code }` | `{ recoveryCodes: string[] }` |
| POST | `/mfa/revoke` | autenticado | `{ password }` | `204` |
| POST | `/mfa/recovery-codes` | autenticado | `{ password }` | `{ recoveryCodes: string[] }` |
| GET | `/mfa/status` | autenticado | — | `{ enrolled, type, confirmedAt, recoveryCodesLeft }` |

Los DTO y sus Zod van en `packages/contracts/src/identity/mfa.ts`, re-exportados desde `src/index.ts`, y la API los valida con el `ZodValidationPipe` global. Frontend y API tipan contra el mismo paquete.

## 7. Opcionalidad y desbloqueo

Resuelto en [ADR 0012](adr/0012-mfa-opcional-y-permiso-de-desbloqueo.md), que reemplaza la obligatoriedad del ADR 0008.

**MFA es opcional para todos los roles.** Es una configuración de cuenta que la persona activa y desactiva cuando quiere. Al registrarse se recomienda, no se exige. Por tanto **no existe** `identity/mfa-required` como bloqueo de panel: ese código se elimina de la tabla de errores de la §3 y ningún guard exige segundo factor.

**Desbloquear es un permiso acotado.** Cuando alguien pierde el dispositivo y sus diez códigos, solo un operador autorizado le devuelve el acceso. Ser `super_admin` no basta:

```
mfa_unlock_operator
  user_id     uuid PK FK user ON DELETE CASCADE
  granted_by  uuid FK user
  granted_at  timestamptz
```

Endpoint adicional:

| Método | Ruta | Guard | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/mfa/unlock` | `@Roles('super_admin')` + operador | `{ userId, reason }` | `204` |

El caso de uso `unlock-mfa.use-case.ts` exige **las dos condiciones** —rol `super_admin` y fila en `mfa_unlock_operator`— y audita `identity.mfa.unlocked` con quién desbloqueó a quién y por qué. Revocar el factor deja la cuenta sin MFA; la persona vuelve a enrolar desde cero.

Queda **abierto y recomendado**: exigir MFA a los propios operadores de desbloqueo. Son el último recurso de recuperación de todos los demás. No es decisión de este documento.

## 8. Límites y auditoría

- Rate limit por `challengeId` y por IP en el guard `RateLimit` del edge, que ya corre primero en la cadena. Propuesta: 5 intentos por desafío, luego `identity/mfa-locked`.
- Bloqueo temporal exponencial por usuario tras fallos repetidos.
- `AuditInterceptor` ya es global. Eventos a registrar con nombres punteados, como el resto: `identity.mfa.enrolled`, `identity.mfa.confirmed`, `identity.mfa.verified`, `identity.mfa.failed`, `identity.mfa.revoked`, `identity.mfa.recovery_used`, `identity.mfa.locked`.
- **Nunca** loguear el secreto, el código TOTP ni los códigos de recuperación. Ni siquiera truncados.

## 9. Frontend (después, no ahora)

Cuando el API esté, la ruta `/2fa` deja de ser maqueta:

- Recibe el `challengeId` del login y postea a `/auth/mfa/verify`.
- Enlace a "usar un código de recuperación".
- En `account/`, pantalla de enrolamiento con QR generado **en el cliente** a partir del `otpauthUri` — el QR nunca viaja por la red.
- Los códigos de recuperación se muestran una vez, con opción de descargar, y no se guardan en `localStorage`.

Mientras tanto `/2fa` sigue marcada como demo, según el ADR 0008.

## 10. Checklist de pruebas

- Login con MFA activo devuelve desafío, no sesión.
- Código válido emite sesión; inválido no, y cuenta contra el límite.
- Desafío vencido no sirve aunque el código sea correcto.
- Código de recuperación funciona una sola vez.
- Revocar exige contraseña y desactiva el factor.
- Un `admin_local` sin MFA no alcanza endpoints de su panel.
- El secreto no aparece en ninguna respuesta después de confirmar.
- e2e del flujo completo en `interfaces/http/*.e2e.spec.ts`.
