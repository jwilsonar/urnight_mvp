# ADR 0012 — Obligatoriedad de MFA por rol y permiso acotado de desbloqueo

- **Estado:** Aceptado
- **Fecha:** 2026-08-04
- **Complementa:** [ADR 0008](0008-roadmap-mfa.md) — confirma su obligatoriedad y resuelve lo que dejaba abierto

## Contexto

El ADR 0008 decidió TOTP como segundo factor y lo declaró obligatorio para
`super_admin` y `admin_local`. Al bajarlo a contrato
([`docs/spec-mfa-identity.md`](../spec-mfa-identity.md)) quedaron dos huecos: qué
pasa con las cuentas de panel que ya existen, y quién desbloquea a alguien que
perdió el dispositivo **y** sus diez códigos de recuperación.

La dirección de producto resolvió ambos.

## Decisión

### 1. La obligatoriedad depende del rol

| Rol | MFA |
|---|---|
| `super_admin` | **Obligatorio** |
| `admin_local` | **Obligatorio** |
| `promoter` | Opcional, recomendado |
| `validator` | Opcional, recomendado *(ver nota)* |
| `user` | Opcional, recomendado |

Para los roles opcionales es una configuración de cuenta corriente: la persona
lo activa y lo desactiva cuando quiere. Se recomienda al registrarse; no se
exige, y no bloquea el uso de la plataforma.

> **Nota sobre `validator`:** el ADR 0008 preveía extenderle la obligación más
> adelante. Aquí queda como opcional porque la decisión de producto nombró
> explícitamente a promotores y usuarios. La cuenta de validador opera en puerta
> sobre un dispositivo compartido, así que conviene revisarlo por separado.

### 2. Las cuentas obligadas enrolan en el siguiente inicio de sesión

No hay corte duro ni migración manual. Cuando un `super_admin` o `admin_local`
sin factor activo inicia sesión, obtiene sesión válida pero **en estado de
enrolamiento pendiente**: solo alcanza los endpoints de `/mfa/enroll` y la
pantalla que los consume. Cualquier otra ruta de panel responde
`identity/mfa-required`.

Así nadie queda fuera de su propio panel y la adopción ocurre sola, sin
intervención de soporte. Aplica igual a las cuentas de desarrollo ya creadas.

### 3. Desbloquear es un permiso acotado, no un rol

Cuando alguien pierde el dispositivo y sus diez códigos de recuperación, solo un
operador autorizado le devuelve el acceso.

Ese permiso **no** lo tiene todo `super_admin`. Ser `super_admin` es condición
necesaria pero no suficiente: hace falta además estar en una lista explícita de
operadores. Hoy esa lista son las cuentas de dirección; un `super_admin`
operativo que se sume más adelante no la hereda.

Como el RBAC es una lista cerrada de cinco roles con `CHECK` en la tabla `role`,
y no existe tabla de permisos, se modela con tabla propia en vez de inventar un
sexto rol:

```
mfa_unlock_operator
  user_id     uuid PK FK user ON DELETE CASCADE
  granted_by  uuid FK user
  granted_at  timestamptz
```

El caso de uso exige **las dos condiciones** —rol `super_admin` y fila en
`mfa_unlock_operator`— y audita siempre quién desbloqueó a quién y por qué.

## Consecuencias

- El estado "enrolamiento pendiente" es una tercera situación de sesión, además
  de autenticado y no autenticado. El edge y el cliente web tienen que
  distinguirla, y es la parte con más riesgo de dejar un agujero: si un guard
  olvida comprobarla, un admin sin MFA opera con normalidad.
- `identity/mfa-required` no es un error de login sino de autorización posterior.
  La web debe reaccionar redirigiendo al enrolamiento, no cerrando sesión.
- Otorgar y revocar el permiso de desbloqueo necesita pantalla y auditoría
  propias. Sin eso, la lista se administra a mano en base de datos.
- **Queda abierto y recomendado:** exigir MFA también a los operadores de
  desbloqueo. Son el último recurso de recuperación de todos los demás; si esa
  cuenta cae, cae el mecanismo entero. Al ser `super_admin`, la obligatoriedad
  de la tabla de arriba ya los cubre — conviene confirmarlo explícitamente.
- La ruta `/2fa` sigue siendo maqueta hasta que el API emita desafíos reales.
