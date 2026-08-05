# ADR 0013 — Comprar entradas con una cuenta que pertenece a una empresa

- **Estado:** Propuesto · pendiente de revisión de Wilson
- **Fecha:** 2026-08-05
- **Afecta a:** `apps/api/src/modules/ticketing`, invariante multi-tenant de `CLAUDE.md`

## Contexto

Un promotor intentó comprar una entrada y el API respondió **403
`auth/tenant-forbidden`**. No es un caso de borde: **ningún `promoter` ni
`admin_local` puede comprar una entrada hoy**, ni siquiera en un local ajeno.

La causa está en cuatro puntos del flujo de compra, todos con la misma forma:

| Archivo | Línea |
|---|---|
| `create-ticket-hold.use-case.ts` | 47 (`assertTenantWhenScoped`) |
| `convert-ticket-hold.use-case.ts` | 66 y 89 |
| `release-ticket-hold.use-case.ts` | 43 |

```ts
if (scopedCompanyId(scope) !== undefined) assertTenant(scope, companyId);
```

Cualquier usuario con `companyId` en su JWT queda atado a su empresa. Al comprar
en un evento de **otra** empresa, el guard lo lee como acceso cruzado entre
tenants y corta.

El problema de fondo es una **confusión de conceptos**: se compara "para quién
trabajo" con "qué puedo comprar". El invariante multi-tenant existe para que una
empresa no vea ni administre recursos de otra. Una reserva de cupo y una orden
**no son recursos de una empresa**: pertenecen a la persona, y su dueño ya está
garantizado por `userId` (ver la comprobación `replacement.userId !== input.userId`).

## Opciones evaluadas

### A · Cuenta aparte para comprar

El promotor mantiene su cuenta de trabajo y crea otra como consumidor.

Se descarta. Duplica identidades por un problema que no es del usuario: dos
contraseñas, dos enrolamientos de MFA, entradas repartidas entre cuentas, y la
pregunta "¿con cuál entré?" cada vez. Además no resuelve nada de fondo — solo
esconde el error detrás de trabajo manual.

### B · Sacar el scope del flujo de compra · **recomendada**

Comprar es un acto **personal**. Se elimina `assertTenant` de los cuatro puntos
del flujo de compra y la persona usa la cuenta que ya tiene.

Lo que **no** cambia, y por eso es seguro:

- La propiedad de la reserva y de la orden se sigue validando por `userId`.
- Las lecturas y la administración de recursos de empresa —pedidos del local,
  eventos, promotores, métricas— **conservan** su `assertTenant` intacto. El
  invariante sigue vivo donde tiene sentido.
- No se toca `tenantScopeOf` ni `scopedCompanyId`: la regla sigue viviendo en un
  solo sitio, como exige `CLAUDE.md`.

### C · Distinguir explícitamente actuar como persona o como empresa

Modelar en el token o en el endpoint si el actor compra para sí o en nombre de la
empresa.

Es la opción más fiel a largo plazo, y la que hará falta el día que un local
compre entradas para invitados y quiera facturarlas a la empresa. Hoy nadie ha
pedido eso, así que añadiría maquinaria sin caso de uso. Queda anotada como el
camino natural cuando aparezca.

## Decisión propuesta

Adoptar **B**. Retirar la comprobación de tenant de `CreateTicketHoldUseCase`,
`ConvertTicketHoldUseCase` y `ReleaseTicketHoldUseCase`, dejándola intacta en el
resto del sistema.

## Riesgo que esto sí abre, y que conviene atacar aparte

Un promotor puede comprar en **su propio** evento usando **su propio** código de
promoción y auto-atribuirse la comisión. Hoy el 403 lo impedía por accidente, no
por diseño.

Eso **no** es aislamiento multi-tenant, es una regla de atribución, y merece su
propia defensa: prohibir que un promotor redima un código del que él mismo es
titular, y registrar el intento en auditoría. Debe implementarse junto con este
cambio, no después, o se cambia un fallo visible por uno silencioso.

Un `admin_local` comprando en su propio local no tiene ese problema: no hay
comisión de por medio.

## Consecuencias

- Promotores y admins compran con la cuenta que ya tienen, sin duplicar identidad.
- Se puede sembrar datos de prueba de compra desde cuentas de panel, cosa que hoy
  obliga a crear un consumidor aparte.
- El invariante multi-tenant queda **más** claro, no menos: se aplica a recursos
  de empresa y no a actos personales.
- Hacen falta pruebas que fijen la frontera: un promotor compra en otro local y lo
  consigue, y ese mismo promotor sigue sin ver pedidos ni métricas de ese local.
