# ADR 0006 — Access token del backend expuesto al cliente (vs. proxy BFF)

- **Estado:** Aceptado
- **Fecha:** 2026-07-07
- **Contexto:** Auditoría frontend 2026-07-07 (`docs/AUDIT_FRONTEND_2026-07-07.md`, hallazgo M1)

## Contexto

La web (Next.js) consume el API NestJS directamente con `Authorization: Bearer`
desde client components. Para eso, el callback `session` de NextAuth copia el
access token del backend a `session.accessToken`, que es legible por JavaScript
del navegador (recuperable vía `GET /api/auth/session`). Un XSS podría
exfiltrar ese token y usarlo contra el API mientras esté vigente.

La alternativa habitual es un **BFF**: route handlers de Next que proxean cada
llamada al API y mantienen el token exclusivamente server-side (cookie httpOnly).

## Decisión

**Se acepta exponer el access token al cliente**, con las mitigaciones listadas
abajo. No se construye un proxy BFF.

## Fundamentos

1. **El refresh token nunca llega al navegador.** El login hace handoff de
   tokens server→server (`lib/auth-actions.ts` → provider Credentials) y el
   refresh vive solo en el JWT de NextAuth (cookie httpOnly cifrada). Lo único
   expuesto es el access token, con TTL de 15 minutos (`JWT_ACCESS_TTL=900`).
2. **Ventana de exposición acotada.** Desde 2026-07-07, si el refresh falla el
   token se limpia del JWT y la sesión deja de entregar `accessToken`
   (`lib/auth.ts`); el cliente fuerza re-login (`lib/auth/session-expiry.ts`).
3. **Mitigación del vector XSS.** La app no tiene `dangerouslySetInnerHTML` ni
   scripts de terceros salvo Google Maps JS; los headers de seguridad y la CSP
   (`next.config.ts`, hallazgos A1/P0.3) restringen a qué orígenes puede
   conectarse o cargar scripts el navegador. La CSP pasa a enforce tras el
   periodo Report-Only (`CSP_ENFORCE=true`).
4. **Costo del BFF desproporcionado para el MVP.** El patrón directo-al-API es
   el estándar en ~43 client components más el flujo de uploads presignados con
   progreso XHR. Un BFF implicaría reescribirlos, duplicar la superficie del API
   en Next, añadir un salto de latencia por request y complicar el presign.

## Condiciones de re-evaluación

Reabrir esta decisión si ocurre cualquiera de:

- Se introducen scripts de terceros (analytics, chat, pagos embebidos).
- El TTL del access token supera los 15 minutos.
- Se encuentra un XSS real en la aplicación.
- La CSP no puede pasarse a enforce por dependencias nuevas.

## Endurecimiento futuro (backlog)

- CSP estricta con nonce por-request vía `proxy.ts` (elimina `'unsafe-inline'`
  de `script-src`) — la mitigación XSS definitiva que complementa esta decisión.
