# ADR 0011 — Sesión deslizante y rotación refresh idempotente

**Estado:** Aceptado · **Fecha:** 2026-08-01

## Contexto

Auth.js resuelve su callback JWT desde RSC, route handlers y `useSession`. Cuando
vence el access token, varias resoluciones concurrentes pueden presentar el mismo
refresh token. La rotación estricta anterior aceptaba la primera petición y trataba
las siguientes como robo, revocando también el refresh recién emitido al ganador.

La expiración visible debe representar inactividad real, no el vencimiento normal
del access token mientras la persona sigue usando la aplicación. El timeout debe
ser editable por superadmins sin consultar el API en cada resolución de sesión.

## Decisión

1. Redis reclama atómicamente el JTI viejo y conserva durante 60 segundos el par
   emitido. Los usos concurrentes dentro de esa gracia reciben el mismo resultado.
   Al vencer la clave, un nuevo uso conserva la revocación antifraude de la familia.
2. Cada proceso web comparte una promesa de refresh por refresh token. Redis sigue
   siendo la coordinación autoritativa entre procesos e instancias.
3. Auth.js usa sesión JWT deslizante. `maxAge` toma el timeout efectivo,
   `updateAge` es 60 segundos y el JWT conserva `lastActivityAt`.
4. El cliente no hace polling periódico de sesión. Interacciones visibles de
   teclado, puntero, tacto o scroll sincronizan actividad como máximo una vez por
   minuto; un temporizador local conserva el redirect de sesión expirada.
5. `session.idle_timeout_minutes` es un `platform_setting` numérico entero entre
   5 y 1440. Su lectura es pública como configuración de cliente y su escritura
   sigue protegida por `@Roles('super_admin')`.
6. Cada proceso web cachea el valor 60 segundos y comparte la consulta en curso.
   Si el ajuste falta, es inválido o el API no responde en dos segundos, usa 30
   minutos. Esto evita una llamada al API por cada resolución de sesión.

## Consecuencias

- Una ventana de gracia permite que una copia robada del refresh sea utilizada
  durante hasta 60 segundos; fuera de ella se mantiene la respuesta antifraude.
- El single-flight en memoria no coordina réplicas, por lo que el estado Redis es
  obligatorio para despliegues horizontales.
- Eventos generados por prefetch del servidor pueden contarse como actividad. El
  polling del `SessionProvider` queda desactivado para que un tab en background no
  prolongue por sí solo la sesión.
- Un cambio del setting puede tardar hasta 60 segundos en propagarse a cada proceso.
