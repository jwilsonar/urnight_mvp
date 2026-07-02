# ADR 0003 — Modelo de atribución vía promo/redemption codes (no referral links con ventana de 7 días)

**Estado:** Aceptado · **Fecha:** 2026-07-02

## Contexto

`PROJECT_SPECS.md` §4.3 describe la atribución de ventas a promotores como una
**"ventana de 7 días"**: el asistente hace clic en el link de referido del
promotor, y toda compra suya dentro de los 7 días siguientes se le atribuye al
promotor (modelo *last-click con expiración temporal*).

La auditoría 2026-07-02 (hallazgo **A1**) constató que ese modelo **no está
implementado y su cadena está muerta de extremo a extremo**:

- No existe ningún chequeo temporal de 7 días en el código (0 comprobaciones de
  ventana). `SaleAttribution.estimate()` sella `attributedAt = now` pero nada lo
  compara contra la fecha de un clic.
- La atribución se dispara sólo si `OrderPaid.referralCode` viene informado, y
  ese campo **ningún cliente lo envía**: `CreateOrderDto.referralCode` viaja como
  opcional en el checkout pero web/mobile/validator tienen 0 usos (el buscador no
  encuentra emisores). El subscriber `OrderPaidSubscriber` corta con
  `if (!p.referralCode) return;`, así que `AttributeSaleUseCase` no llega a
  ejecutarse en producción.
- El modelo **real y vivo** que reemplazó a los referral links es el de
  **promo/redemption codes**: el admin asigna un evento a un promotor con cupo +
  descuento por tipo de entrada (`promoter_event` + `promoter_ticket_allocation`);
  el promotor genera **códigos de canje single-use** (`GenerateRedemptionCodeUseCase`);
  el asistente los canjea en el checkout y el canje queda registrado en
  `promo_code_redemption` (`PromoRedemptionService.redeem`, dentro de la Tx del
  checkout, con `PromoRedemptionPort`). El vínculo promotor↔código es directo:
  `promo_code.promoter_id`.

Persistir un modelo documentado que no se ejecuta genera *spec-drift* silencioso.
El monorepo exige que toda desviación respecto a SPECS se registre como ADR
(`CLAUDE.md`, SPECS §8).

## Decisión

1. **Se oficializa el modelo de atribución por promo/redemption codes** y se
   **deja sin efecto la "ventana de 7 días" de §4.3.** La atribución de una compra
   a un promotor ocurre de forma **explícita y determinista** en el momento del
   checkout: si el asistente aplica un código cuyo `promo_code.promoter_id`
   apunta a un promotor, esa compra queda ligada a ese promotor vía la fila
   `promo_code_redemption`. No hay ventana temporal ni cookie de last-click.

2. **Los referral links se conservan** como artefacto de *compartir + tracking de
   clics* (`referral_link`, endpoint público `POST /promoters/referrals/:code/click`,
   tarjeta en el panel del promotor). **No** son el mecanismo de atribución de
   comisiones: su clic no abre ninguna ventana ni credita ventas por sí solo.

3. **Se retira la ficción documental, no el código en uso.** Se eliminan los
   comentarios engañosos de "ventana 7 días" en el módulo (`AttributeSaleUseCase`,
   `SaleAttribution`, `OrderPaidSubscriber`). `AttributeSaleUseCase` +
   `sale_attribution` se mantienen (los cubre el e2e del módulo y el panel de
   ventas del promotor los lee), pero se documenta que su gatillo por
   `referralCode` está **inerte** mientras ningún cliente informe ese campo.

## Alternativas consideradas

- **Implementar la ventana de 7 días real** (persistir cada clic con timestamp y,
  en `OrderPaid`, buscar el clic más reciente del comprador dentro de 7 días).
  Descartada: reintroduce complejidad (cookies/identidad del clic anónimo,
  atribución probabilística, disputas) para un mecanismo que el producto ya
  reemplazó por códigos explícitos y auditables. Mayor superficie de fraude.

- **Borrar por completo referral links y atribución.** Descartada por
  conservadurismo: el link de referido es una feature viva del panel del promotor
  (se muestra, se copia, cuenta clics) y `sale_attribution` está cubierto por el
  e2e del módulo. Arrancarlo excede el alcance de este cambio y cruzaría a
  `ticketing`/`contracts/checkout`.

## Consecuencias

- SPECS §4.3 queda **superado por este ADR** en lo relativo a la ventana de 7
  días. La atribución es la del canje de códigos (`promo_code_redemption`).
- El promotor cobra/mide su desempeño por **códigos canjeados**, no por clics ni
  por ventana temporal. El panel de ventas (`ListPromoterSalesUseCase` sobre
  `sale_attribution`) refleja únicamente atribuciones sembradas por el gatillo
  inerte de `referralCode`; hoy será vacío en producción.
- La tasa de comisión deja de estar hardcodeada dispersa: se centraliza en
  `application/config/commission.ts` con override por env, pendiente de mover a
  `PLATFORM_SETTING` (ver TODOs).

## Deuda / TODOs de seguimiento (fuera del alcance del módulo `promoters`)

- **TODO(ticketing):** retirar el campo muerto `referralCode` de
  `CreateOrderDto` (`packages/contracts/src/checkout/order.ts`), del
  `OrderPaidEvent` (`ticketing/domain/events/checkout.events.ts`) y del
  `OrderPaidSubscriber`; o bien re-cablearlo para que `OrderPaid` transporte el
  `promoterId` del código canjeado y `AttributeSaleUseCase` credite comisiones
  desde `promo_code_redemption` en lugar de desde `referral_code`.
- **TODO(promoters):** cuando lo anterior ocurra, reconectar
  `ListPromoterSalesUseCase` a los canjes reales (`promo_code_redemption` →
  `promo_code.promoter_id`) para que el panel de ventas del promotor refleje sus
  comisiones efectivas.
- **TODO(#M19):** mover `PROMOTER_COMMISSION_RATE` a `PLATFORM_SETTING`.
