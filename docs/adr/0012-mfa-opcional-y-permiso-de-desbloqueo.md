# ADR 0012 — MFA opcional y permiso acotado de desbloqueo

- **Estado:** Aceptado
- **Fecha:** 2026-08-04
- **Reemplaza parcialmente:** [ADR 0008](0008-roadmap-mfa.md) — la obligatoriedad por rol

## Contexto

El ADR 0008 decidió TOTP como segundo factor y lo declaró **obligatorio** para
`super_admin` y `admin_local`. Al bajar esa decisión a contrato
([`docs/spec-mfa-identity.md`](../spec-mfa-identity.md)) aparecieron dos huecos
que el ADR no resolvía: qué pasa con las cuentas de panel ya existentes, y quién
desbloquea a alguien que perdió el dispositivo y sus códigos de recuperación.

La dirección de producto resolvió ambos.

## Decisión

### 1. MFA es opcional para todos los roles

Se abandona la obligatoriedad. MFA pasa a ser una configuración de cuenta que
la persona activa y desactiva cuando quiere, como en cualquier plataforma
conocida. Al crear una cuenta se **recomienda** activarlo; no se exige.

Consecuencia directa: desaparece el problema de las cuentas de panel
existentes. Nadie queda fuera de su panel por no haber enrolado.

### 2. Desbloquear MFA es un permiso acotado, no un rol

Cuando alguien pierde el dispositivo **y** sus diez códigos de recuperación,
solo un operador autorizado puede devolverle el acceso.

Ese permiso **no** lo tiene todo `super_admin`. Ser `super_admin` es condición
necesaria pero no suficiente: hace falta además estar en una lista explícita de
operadores de desbloqueo. Hoy esa lista son las cuentas de dirección; un
`super_admin` operativo que se sume más adelante no la hereda.

Como el RBAC actual es una lista cerrada de cinco roles con `CHECK` en la tabla
`role`, y no existe tabla de permisos, se modela con una tabla propia en vez de
inventar un sexto rol:

```
mfa_unlock_operator
  user_id     uuid PK FK user ON DELETE CASCADE
  granted_by  uuid FK user
  granted_at  timestamptz
```

El caso de uso de desbloqueo exige las dos condiciones —rol `super_admin` **y**
fila en `mfa_unlock_operator`— y audita siempre, con quién desbloqueó a quién.

## Consecuencias

- **Menor seguridad asumida a conciencia.** Las cuentas con panel pueden operar
  sin segundo factor. La superficie que el ADR 0008 quería cerrar sigue abierta
  y depende solo de la contraseña. La dirección acepta ese riesgo a cambio de no
  bloquear la operación.
- **Recomendación pendiente de decidir:** que los propios operadores de
  desbloqueo tengan MFA obligatorio. Son el último recurso de recuperación de
  todos los demás; si su cuenta cae, cae el mecanismo entero. Queda como
  propuesta abierta, no como decisión de este ADR.
- Otorgar y revocar el permiso de desbloqueo necesita su propia pantalla y su
  propia auditoría. Sin eso, la lista se administra a mano en base de datos.
- La ruta `/2fa` sigue siendo maqueta hasta que el API emita desafíos reales.
  Este ADR no cambia esa parte del 0008.
